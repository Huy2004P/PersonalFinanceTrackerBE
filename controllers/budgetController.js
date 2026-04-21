const { db, admin } = require('../config/firebase');
const { budgetSchema } = require('../models/budgetModel');

/**
 * 1. HÀM TẠO THÔNG BÁO (createBudgetAlert)
 * Nhiệm vụ: Kiểm tra ngưỡng chi tiêu, lưu vào Firestore và Push qua FCM.
 */
const createBudgetAlert = async (uid, budget, percent) => {
    console.log(`[DEBUG] Đang kiểm tra điều kiện báo động cho: ${budget.categoryName} (${percent.toFixed(1)}%)`);

    let title = "";
    let message = "";
    let type = "warning";

    // Xác định nội dung dựa trên phần trăm chi tiêu
    if (percent >= 100) {
        title = "🚨 Vượt hạn mức chi tiêu!";
        message = `Bạn đã dùng ${percent.toFixed(0)}%, vượt hạn mức của danh mục ${budget.categoryName}.`;
        type = "danger";
    } else if (percent >= 80) {
        title = "⚠️ Sắp chạm hạn mức";
        message = `Ngân sách danh mục ${budget.categoryName} đã sử dụng đến ${percent.toFixed(0)}%.`;
        type = "warning";
    }

    // Nếu đạt ngưỡng (>= 80%) thì mới xử lý tiếp
    if (title) {
        try {
            // BỘ LỌC CHỐNG SPAM: Kiểm tra xem 24h qua đã báo chưa
            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            const recentNotification = await db.collection('notifications')
                .where('uid', '==', uid)
                .where('categoryId', '==', budget.categoryId)
                .where('createdAt', '>=', oneDayAgo)
                .get();

            if (recentNotification.empty) {
                console.log(`[DEBUG] Đủ điều kiện gửi tin! Đang lưu & bắn FCM cho: ${budget.categoryName}`);

                // Bước A: Lưu vào Firestore để hiện trong màn hình thông báo của App
                await db.collection('notifications').add({
                    uid,
                    title,
                    message,
                    type,
                    categoryId: budget.categoryId,
                    isRead: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Bước B: Lấy Token từ profile user và bắn FCM
                const userDoc = await db.collection('users').doc(uid).get();
                const fcmToken = userDoc.data()?.fcmToken;

                // [controllers/budgetController.js]

                if (fcmToken) {
                    const payload = {
                        token: fcmToken,
                        // PHẦN 1: Notification - Hệ thống tự hiện banner khi App ở Background
                        notification: {
                            title: title,
                            body: message,
                        },
                        // PHẦN 2: Data - Gửi dữ liệu thô để Flutter tự vẽ thông báo khi App đang mở
                        data: {
                            click_action: "FLUTTER_NOTIFICATION_CLICK",
                            title: title,
                            body: message,
                            screen: "notification_screen",
                            type: type // danger hoặc warning
                        },
                        android: {
                            priority: "high",
                            notification: {
                                channelId: "high_importance_channel", // Phải khớp với Flutter
                                priority: "high",
                            }
                        }
                    };

                    await admin.messaging().send(payload);
                    console.log(`[FCM] Đã gửi 2 loại thông báo thành công!`);
                }
            } else {
                console.log(`[DEBUG] SKIP: Danh mục ${budget.categoryName} đã báo trong 24h qua rồi.`);
            }
        } catch (error) {
            console.error("[ALERT ERROR] Lỗi hệ thống thông báo:", error.message);
        }
    } else {
        console.log(`[DEBUG] SAFE: ${budget.categoryName} vẫn nằm trong vùng an toàn.`);
    }
};

/**
 * 2. HÀM QUÉT SỐ LIỆU (internalCheckBudget)
 * Nhiệm vụ: Tính toán lại chi tiêu và gọi lệnh báo động.
 */
exports.internalCheckBudget = async (uid, categoryId) => {
    try {
        const budgetSnapshot = await db.collection('budgets')
            .where('uid', '==', uid)
            .where('categoryId', '==', categoryId)
            .get();

        if (budgetSnapshot.empty) return;

        for (let bDoc of budgetSnapshot.docs) {
            const b = bDoc.data();
            
            // Tính tổng tiền từ các giao dịch thực tế
            const transactions = await db.collection('transactions')
                .where('uid', '==', uid)
                .where('categoryId', '==', categoryId)
                .where('type', '==', 'EXPENSE') 
                .get();

            let currentSpent = 0;
            transactions.forEach(t => {
                currentSpent += Math.abs(Number(t.data().amount) || 0);
            });

            const limit = b.limitAmount || 1;
            const currentPercent = (currentSpent / limit) * 100;

            // QUAN TRỌNG: Gọi lệnh kiểm tra thông báo LUÔN LUÔN khi quét (nhưng hàm alert sẽ tự lọc spam 24h)
            await createBudgetAlert(uid, { ...b, id: bDoc.id }, currentPercent);

            // BỘ LỌC CHỐNG LẶP (ANTI-LOOP): Chỉ cập nhật Database nếu con số thực sự thay đổi
            if (b.spentAmount !== currentSpent || b.percentUsed !== currentPercent) {
                await bDoc.ref.update({
                    spentAmount: currentSpent,
                    remainingAmount: (b.limitAmount || 0) - currentSpent,
                    percentUsed: currentPercent,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[SYNC] Đã cập nhật số liệu mới cho: ${b.categoryName}`);
            }
        }
    } catch (e) {
        console.error("[INTERNAL ERROR] Lỗi quét ngân sách:", e.message);
    }
};

/**
 * 3. API: LẤY DANH SÁCH (getBudgets) - Kích hoạt khi Huy nhấn RELOAD trên App
 */
exports.getBudgets = async (req, res) => {
    try {
        const uid = req.user.uid;
        console.log(`[API] Nhận lệnh reload từ App cho User: ${uid}`);
        
        // Bước 1: Lấy danh sách ngân sách hiện tại
        const budgetsSnapshot = await db.collection('budgets').where('uid', '==', uid).get();
        
        // Bước 2: Ép Server quét lại toàn bộ để kiểm tra chi tiêu mới nhất và bắn thông báo (nếu có)
        const checkPromises = budgetsSnapshot.docs.map(doc => 
            this.internalCheckBudget(uid, doc.data().categoryId)
        );
        await Promise.all(checkPromises); 
        
        // Bước 3: Lấy dữ liệu đã được làm mới để trả về cho Flutter
        const finalSnapshot = await db.collection('budgets').where('uid', '==', uid).get();
        const data = finalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        res.json({ status: 'success', data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

/**
 * 4. API: TẠO/CẬP NHẬT (createBudget)
 */
exports.createBudget = async (req, res) => {
    try {
        const data = budgetSchema(req.body);
        data.uid = req.user.uid;
        data.createdAt = admin.firestore.FieldValue.serverTimestamp();
        data.spentAmount = data.spentAmount || 0;
        data.percentUsed = data.percentUsed || 0;

        const existing = await db.collection('budgets')
            .where('uid', '==', req.user.uid)
            .where('categoryId', '==', data.categoryId)
            .get();

        if (!existing.empty) {
            const docId = existing.docs[0].id;
            await db.collection('budgets').doc(docId).update({
                limitAmount: data.limitAmount,
                period: data.period,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await this.internalCheckBudget(req.user.uid, data.categoryId);
            return res.json({ message: "Đã cập nhật hạn mức ngân sách" });
        }

        await db.collection('budgets').add(data);
        await this.internalCheckBudget(req.user.uid, data.categoryId);
        
        res.status(201).json({ message: "Thiết lập ngân sách thành công" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

/**
 * 5. API: XÓA (deleteBudget)
 */
exports.deleteBudget = async (req, res) => {
    try {
        const docRef = db.collection('budgets').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) return res.status(404).json({ error: "Không tìm thấy" });
        if (doc.data().uid !== req.user.uid) return res.status(403).json({ error: "Không có quyền" });

        await docRef.delete();
        res.json({ message: "Đã xóa ngân sách" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};