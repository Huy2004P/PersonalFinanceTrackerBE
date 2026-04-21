const { db, admin } = require('../config/firebase');
const { walletSchema } = require('../models/walletModel');

// 1. LẤY DANH SÁCH VÍ CỦA NGƯỜI DÙNG
exports.getWallets = async (req, res) => {
    // In ra UID để kiểm tra xem Auth có hoạt động không
    console.log(">>> [GET WALLETS] Đang lấy ví cho UID:", req.user ? req.user.uid : "NULL");

    try {
        // LƯU Ý: Nếu lỗi 500 xuất hiện ở đây, 90% là do thiếu Firestore Index
        // Huy có thể tạm xóa dòng .orderBy() bên dưới để kiểm tra
        const snapshot = await db.collection('wallets')
            .where('uid', '==', req.user.uid)
            .orderBy('createdAt', 'desc') 
            .get();

        const wallets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(">>> [GET WALLETS] Thành công. Tìm thấy:", wallets.length, "ví");
        res.status(200).json(wallets);
    } catch (e) {
        // IN LỖI CHI TIẾT RA TERMINAL SERVER
        console.error("!!! [GET WALLETS ERROR]:", e);
        res.status(500).json({ error: "Không thể lấy danh sách ví: " + e.message });
    }
};

// 2. TẠO VÍ MỚI
exports.createWallet = async (req, res) => {
    console.log(">>> [CREATE WALLET] Dữ liệu nhận được:", req.body);
    try {
        const walletData = walletSchema(req.body);
        walletData.uid = req.user.uid;

        const docRef = await db.collection('wallets').add(walletData);
        
        console.log(">>> [CREATE WALLET] Thành công. ID:", docRef.id);
        res.status(201).json({
            id: docRef.id,
            ...walletData,
            message: "Tạo ví mới thành công!"
        });
    } catch (e) {
        console.error("!!! [CREATE WALLET ERROR]:", e);
        res.status(500).json({ error: "Lỗi khi tạo ví: " + e.message });
    }
};

// 3. CẬP NHẬT THÔNG TIN VÍ
exports.updateWallet = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(">>> [UPDATE WALLET] ID:", id);
        const updates = {
            name: req.body.name,
            color: req.body.color,
            type: req.body.type,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        await db.collection('wallets').doc(id).update(updates);
        res.json({ message: "Cập nhật thông tin ví thành công!" });
    } catch (e) {
        console.error("!!! [UPDATE WALLET ERROR]:", e);
        res.status(500).json({ error: "Lỗi khi cập nhật ví: " + e.message });
    }
};

// 4. XÓA VÍ
exports.deleteWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const walletRef = db.collection('wallets').doc(id);
        const doc = await walletRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Ví không tồn tại." });
        }

        const walletData = doc.data();

        // RÀNG BUỘC 1: Số dư phải bằng 0 mới được xóa
        if (walletData.balance !== 0) {
            return res.status(400).json({ 
                error: "Không thể xóa ví vẫn còn số dư. Vui lòng chuyển hết tiền sang ví khác hoặc chi tiêu hết trước khi xóa." 
            });
        }

        // (Tùy chọn) RÀNG BUỘC 2: Kiểm tra xem user còn ví nào khác không
        const walletCount = await db.collection('wallets')
            .where('uid', '==', req.user.uid).get();
        if (walletCount.size <= 1) {
            return res.status(400).json({ error: "Bạn phải giữ ít nhất một ví để hoạt động." });
        }

        await walletRef.delete();
        res.json({ message: "Đã xóa ví thành công!" });
    } catch (e) {
        res.status(500).json({ error: "Lỗi khi xóa ví: " + e.message });
    }
};

// 5. CHUYỂN TIỀN NỘI BỘ
exports.transferMoney = async (req, res) => {
    const { fromWalletId, toWalletId, amount, note, date } = req.body;
    console.log(`>>> [TRANSFER] Từ ${fromWalletId} đến ${toWalletId} số tiền ${amount}`);

    const transferAmount = Number(amount);
    if (!fromWalletId || !toWalletId || !transferAmount || fromWalletId === toWalletId) {
        return res.status(400).json({ error: "Thông tin chuyển khoản không hợp lệ." });
    }

    try {
        await db.runTransaction(async (t) => {
            const fromWalletRef = db.collection('wallets').doc(fromWalletId);
            const toWalletRef = db.collection('wallets').doc(toWalletId);

            const fromDoc = await t.get(fromWalletRef);
            const toDoc = await t.get(toWalletRef);

            if (!fromDoc.exists || !toDoc.exists) {
                throw new Error("Một trong hai ví không tồn tại.");
            }

            t.update(fromWalletRef, {
                balance: admin.firestore.FieldValue.increment(-transferAmount)
            });

            t.update(toWalletRef, {
                balance: admin.firestore.FieldValue.increment(transferAmount)
            });

            const transactionRef = db.collection('transactions').doc();
            t.set(transactionRef, {
                uid: req.user.uid,
                amount: transferAmount,
                type: 'TRANSFER',
                fromWalletId,
                toWalletId,
                note: note || `Chuyển tiền từ ${fromDoc.data().name} sang ${toDoc.data().name}`,
                categoryName: "Chuyển tiền",
                date: date || new Date().toISOString(),
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.json({ message: "Chuyển tiền nội bộ thành công!" });
    } catch (e) {
        console.error("!!! [TRANSFER ERROR]:", e);
        res.status(500).json({ error: "Lỗi khi thực hiện chuyển tiền: " + e.message });
    }
};