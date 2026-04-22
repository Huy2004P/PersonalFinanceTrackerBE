const { db, admin } = require('../config/firebase');
const { transactionSchema } = require('../models/transactionModel');
const cloudinary = require('cloudinary').v2;
const budgetController = require('./budgetController');

// --- THƯ VIỆN MỚI CHO PDF ---
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Cấu hình Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Đăng ký Helper cho Handlebars để kiểm tra loại tiền trong Template
handlebars.registerHelper('isExpense', (type) => type === 'EXPENSE');
handlebars.registerHelper('formatCurrency', (val) => Number(val).toLocaleString('vi-VN'));

// 1. Hàm Upload ảnh (Dùng cho hóa đơn)
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("Không có file ảnh");
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ folder: "lumi_finance_transactions" }, (error, result) => {
                if (error) reject(error); else resolve(result);
            }).end(req.file.buffer);
        });
        res.json({ imageUrl: result.secure_url });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// 2. Tạo giao dịch mới (Đã áp dụng Schema, Fix lỗi kind/type, Rút tiền và chặn âm số dư)
exports.createTransaction = async (req, res) => {
    try {
        // Hỗ trợ Flutter nếu đang gửi 'kind' thay vì 'type'
        if (req.body.kind && !req.body.type) {
            req.body.type = req.body.kind;
        }

        // Đưa dữ liệu qua schema để tự động chuẩn hóa
        const transactionData = transactionSchema(req.body);
        transactionData.uid = req.user.uid;

        await db.runTransaction(async (t) => {
            const walletRef = db.collection('wallets').doc(transactionData.walletId);
            const walletDoc = await t.get(walletRef);

            if (!walletDoc.exists) {
                throw new Error("Ví không tồn tại!");
            }

            const currentBalance = Number(walletDoc.data().balance || 0);
            
            // XÁC ĐỊNH LOẠI TRỪ TIỀN (Chi tiêu hoặc Rút tiền)
            const isReducing = transactionData.type === 'EXPENSE' || transactionData.type === 'WITHDRAW' || transactionData.kind === 'EXPENSE';

            // KIỂM TRA SỐ DƯ: Nếu là CHI TIÊU / RÚT TIỀN và số dư không đủ
            if (isReducing && currentBalance < transactionData.amount) {
                throw new Error("Số dư ví không đủ để thực hiện giao dịch này!");
            }

            // Tính toán số dư mới
            const newBalance = transactionData.type === 'INCOME' 
                ? currentBalance + transactionData.amount 
                : currentBalance - transactionData.amount;

            // 1. Lưu giao dịch bằng dữ liệu đã chuẩn hóa từ schema
            const transactionRef = db.collection('transactions').doc();
            t.set(transactionRef, {
                ...transactionData,
                kind: transactionData.type, // Lưu thêm kind dự phòng cho App Flutter bản cũ
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 2. Cập nhật số dư ví
            t.update(walletRef, { balance: newBalance });
        });

        res.status(201).json({ message: "Giao dịch thành công!" });
    } catch (e) {
        console.error("Lỗi giao dịch:", e.message);
        // Trả về lỗi 400 để Frontend hiển thị SnackBar thay vì sập app
        res.status(400).json({ error: e.message }); 
    }
};

// 3. Lấy danh sách giao dịch (Hỗ trợ phân trang)
exports.getTransactions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 15;
        const lastDocId = req.query.lastDocId;
        const type = req.query.type;

        let query = db.collection('transactions').where('uid', '==', req.user.uid);

        if (type && type.toUpperCase() !== 'ALL') {
            query = query.where('type', '==', type.toUpperCase());
        }

        query = query.orderBy('createdAt', 'desc');

        if (lastDocId && lastDocId !== 'null' && lastDocId !== '') {
            const lastDoc = await db.collection('transactions').doc(lastDocId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        query = query.limit(limit);

        const snapshot = await query.get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({
            status: 'success',
            results: data.length,
            lastDocId: data.length > 0 ? data[data.length - 1].id : null,
            data: data
        });
    } catch (e) {
        console.error("LỖI GET TRANSACTIONS:", e.message); 
        res.status(500).json({ error: e.message });
    }
};

// export_controller.js
exports.exportPDF = async (req, res) => {
    try {
        const uid = req.user.uid;

        // 1. LẤY TOÀN BỘ THÔNG TIN USER TỪ FIRESTORE
        const userDoc = await db.collection('users').doc(uid).get();
        const u = userDoc.exists ? userDoc.data() : {};
        
        // Map các trường dữ liệu theo userController.js
        const userInfo = {
            name: u.fullName || u.displayName || u.name || "Khách hàng LumiFinance",
            email: u.email || req.user.email || "Chưa cập nhật",
            phone: u.phoneNumber || u.phone || "N/A",
            address: u.address || "Việt Nam",
            createdAt: u.createdAt ? u.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A'
        };

        // 2. LẤY GIAO DỊCH & TÍNH TOÁN (Giữ nguyên logic tính toán của Huy)
        const snapshot = await db.collection('transactions')
            .where('uid', '==', uid)
            .orderBy('createdAt', 'desc').get();

        let income = 0, expense = 0;
        const transactions = snapshot.docs.map((doc, index) => {
            const d = doc.data();
            const amt = Number(d.amount) || 0;
            if (d.type === 'INCOME') income += amt; 
            else if (d.type === 'EXPENSE') expense += amt;

            return {
                stt: index + 1,
                date: d.createdAt ? d.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A',
                category: d.categoryName || d.category || "Giao dịch",
                wallet: d.walletName || "Ví",
                note: d.note || "-",
                type: d.type,
                amount: amt.toLocaleString('vi-VN')
            };
        });

        // 3. ĐỔ VÀO TEMPLATE
        const templatePath = path.join(__dirname, '../templates/report.html');
        const source = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(source);

        const htmlContent = template({
            ...userInfo,
            reportId: `LF-${Date.now().toString().slice(-6)}`,
            exportDate: new Date().toLocaleDateString('vi-VN'),
            totalIncome: income.toLocaleString('vi-VN'),
            totalExpense: expense.toLocaleString('vi-VN'),
            balance: (income - expense).toLocaleString('vi-VN'),
            count: transactions.length,
            transactions: transactions
        });

        res.header("Content-Type", "text/html");
        res.send(htmlContent);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getTransactionDetail = async (req, res) => {
    try {
        const doc = await db.collection('transactions').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: "Không tìm thấy giao dịch" });
        if (doc.data().uid !== req.user.uid) return res.status(403).json({ error: "Không có quyền xem" });
        res.json({ id: doc.id, ...doc.data() });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// 5. Hàm Thống kê (ĐÃ SỬA ĐỂ TÍNH ĐÚNG TỔNG SỐ DƯ VÀ BỎ QUA CHUYỂN KHOẢN)
exports.getStats = async (req, res) => {
    try {
        const uid = req.user.uid;

        // BƯỚC 1: Tính Tổng Thu/Chi từ Transactions (Loại bỏ TRANSFER)
        const transSnapshot = await db.collection('transactions').where('uid', '==', uid).get();
        let income = 0, expense = 0;

        transSnapshot.docs.forEach(doc => {
            const d = doc.data();
            const amount = Math.abs(Number(d.amount) || 0); 
            const t = (d.type || d.kind || '').toUpperCase();
            
            if (t === 'INCOME') { 
                income += amount; 
            } else if (t === 'EXPENSE' || t === 'WITHDRAW') { 
                expense += amount; // Chỉ cộng chi tiêu thật sự
            }
            // Giao dịch TRANSFER sẽ bị bỏ qua ở đây nên không ảnh hưởng Thống kê
        });

        // BƯỚC 2: Tính TỔNG SỐ DƯ thực tế bằng cách cộng dồn các Ví lại (Chuẩn nhất)
        const walletSnapshot = await db.collection('wallets').where('uid', '==', uid).get();
        let realTotalBalance = 0;

        walletSnapshot.docs.forEach(doc => {
            realTotalBalance += Number(doc.data().balance || 0);
        });

        res.json({ 
            totalIncome: income, 
            totalExpense: expense, 
            totalBalance: realTotalBalance // Lấy chính xác từ tổng tiền các ví
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// 6. Xóa giao dịch (Đã Sửa: Xóa thì Hoàn tiền vào ví)
exports.deleteTransaction = async (req, res) => {
    const transactionId = req.params.id;
    const uid = req.user.uid;

    try {
        await db.runTransaction(async (t) => {
            const transRef = db.collection('transactions').doc(transactionId);
            const transDoc = await t.get(transRef);

            if (!transDoc.exists) throw new Error("Không tìm thấy giao dịch!");
            if (transDoc.data().uid !== uid) throw new Error("Không có quyền xóa!");

            const transData = transDoc.data();
            const walletRef = db.collection('wallets').doc(transData.walletId);
            const walletDoc = await t.get(walletRef);

            if (walletDoc.exists) {
                const currentBalance = Number(walletDoc.data().balance || 0);
                const amount = Number(transData.amount || 0);
                
                // Hoàn tiền: Nếu trước đó là Chi/Rút thì giờ cộng lại, nếu Thu thì trừ đi
                const isReducingType = transData.type === 'EXPENSE' || transData.type === 'WITHDRAW' || transData.kind === 'EXPENSE';
                const restoredBalance = isReducingType 
                    ? currentBalance + amount 
                    : currentBalance - amount;

                t.update(walletRef, { balance: restoredBalance });
            }

            t.delete(transRef);
        });

        res.json({ message: "Đã xóa giao dịch và hoàn tiền vào ví thành công" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};