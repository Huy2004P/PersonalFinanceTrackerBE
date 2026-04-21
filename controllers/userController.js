const { db, admin } = require('../config/firebase');
const { userSchema } = require('../models/userModel'); // Import cái khuôn mẫu vào

exports.createUserProfile = async (req, res) => {
    try {
        const userData = userSchema(req.body);
        userData.email = req.user.email;
        userData.createdAt = admin.firestore.FieldValue.serverTimestamp();

        if (req.body.fcmToken) {
            userData.fcmToken = req.body.fcmToken;
        }

        await db.collection('users').doc(req.user.uid).set(userData);
        res.status(201).json({ message: "Profile created" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// [backend/controllers/userController.js]
exports.updateProfile = async (req, res) => {
    try {
        const uid = req.user.uid;
        const data = req.body;

        // 1. CHẶN không cho ghi đè email từ phía Client gửi lên
        delete data['email'];
        delete data['e-mail'];

        // 2. Lệnh dọn dẹp: Xóa hẳn trường 'e-mail' cũ trong Firestore nếu nó tồn tại
        data['e-mail'] = admin.firestore.FieldValue.delete();
        
        data.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        // 3. Cập nhật các trường còn lại (displayName, organic, phone...)
        await db.collection('users').doc(uid).update(data);
        
        res.json({ message: "Đã cập nhật hồ sơ và dọn dẹp dữ liệu thừa!" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "Mật khẩu ít nhất 6 ký tự" });
        }
        await admin.auth().updateUser(req.user.uid, { password: newPassword });
        res.json({ message: "Cập nhật mật khẩu thành công" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const uid = req.user.uid;
        console.log(`>>> BẮT ĐẦU QUÁ TRÌNH XÓA TÀI KHOẢN CHO UID: ${uid}`);

        // Hàm hỗ trợ xóa toàn bộ document trong một collection theo UID
        // Dùng Promise.all để xóa song song, vượt qua giới hạn 500 của Batch
        const deleteCollectionByUid = async (collectionName) => {
            const snapshot = await db.collection(collectionName).where('uid', '==', uid).get();
            if (snapshot.empty) return;
            
            const promises = [];
            snapshot.docs.forEach((doc) => {
                promises.push(doc.ref.delete());
            });
            await Promise.all(promises);
            console.log(`- Đã xóa ${snapshot.size} document trong [${collectionName}]`);
        };

        // BƯỚC 1: QUÉT VÀ XÓA TẤT CẢ DỮ LIỆU TRONG CÁC BẢNG (COLLECTIONS)
        // Lưu ý: Phải dùng await để đảm bảo xóa xong bảng này mới qua bảng khác (hoặc xóa song song)
        await Promise.all([
            deleteCollectionByUid('transactions'), // Xóa giao dịch
            deleteCollectionByUid('wallets'),      // Xóa ví tiền
            deleteCollectionByUid('budgets'),      // Xóa ngân sách (nếu có)
            deleteCollectionByUid('notifications') // Xóa thông báo (nếu có)
        ]);

        // BƯỚC 2: XÓA PROFILE TRONG BẢNG USERS
        await db.collection('users').doc(uid).delete();
        console.log(`- Đã xóa Profile trong [users]`);

        // BƯỚC 3: XÓA AUTHENTICATION (BƯỚC CHỐT HẠ)
        // Tuyệt đối phải để cuối cùng để tránh lỗi mất quyền truy cập giữa chừng
        await admin.auth().deleteUser(uid);
        console.log(`- Đã xóa tài khoản Authentication`);

        console.log(`>>> HOÀN TẤT XÓA TÀI KHOẢN: ${uid}`);
        res.json({ message: "Đã xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan!" });

    } catch (e) {
        console.error("!!! LỖI XÓA TÀI KHOẢN:", e);
        res.status(500).json({ error: "Lỗi hệ thống khi xóa tài khoản: " + e.message });
    }
};

exports.logout = async (req, res) => {
    try {
        // Với JWT, việc đăng xuất chủ yếu thực hiện ở phía Client bằng cách xóa Token.
        // Tuy nhiên, ta có thể dùng Admin SDK để thu hồi toàn bộ Refresh Tokens của User đó
        // khiến cho Token hiện tại không thể làm mới (refresh) được nữa.
        
        const uid = req.user.uid;
        await admin.auth().revokeRefreshTokens(uid);
        
        res.json({ message: "Đăng xuất thành công. Vui lòng xóa Token ở phía Client." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        // Lưu fcmToken vào đúng Document của người dùng đang đăng nhập
        await db.collection('users').doc(req.user.uid).update({ 
            fcmToken: fcmToken,
            lastUpdatedToken: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ status: 'success', message: "Đã cập nhật Token thông báo!" });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
};

exports.getProfile = async (req, res) => {
    try {
        const uid = req.user.uid;
        // Tìm document của user theo UID trong Firestore
        const doc = await db.collection('users').doc(uid).get();

        if (!doc.exists) {
            // Nếu user chưa từng tạo profile thì trả về lỗi 404
            return res.status(404).json({ error: "Không tìm thấy hồ sơ người dùng" });
        }

        // Trả về dữ liệu gốc từ Firestore (bao gồm e-mail, displayName, organic...)
        res.json(doc.data());
    } catch (e) {
        console.error("Lỗi getProfile:", e.message);
        res.status(500).json({ error: e.message });
    }
};