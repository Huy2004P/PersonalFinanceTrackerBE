const { db, admin } = require('../config/firebase');
const { categorySchema } = require('../models/categoryModel');

// 1. LẤY DANH SÁCH DANH MỤC
exports.getCategories = async (req, res) => {
    try {
        const uid = req.user.uid;

        // Lấy danh mục hệ thống (uid == null) và danh mục của riêng User
        const snapshot = await db.collection('categories')
            .where('uid', 'in', [uid, null]) 
            .get();

        const categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({
            status: 'success',
            data: categories
        });
    } catch (e) {
        res.status(500).json({ error: "Lỗi lấy danh mục: " + e.message });
    }
};

// 2. TẠO DANH MỤC MỚI
exports.createCategory = async (req, res) => {
    try {
        // Dùng "khuôn" categorySchema để lọc req.body
        const categoryData = categorySchema(req.body);
        
        // Gán các giá trị hệ thống tự quản lý
        categoryData.uid = req.user.uid; 
        categoryData.createdAt = admin.firestore.FieldValue.serverTimestamp();

        const docRef = await db.collection('categories').add(categoryData);
        
        res.status(201).json({
            message: "Đã thêm danh mục mới",
            id: docRef.id,
            data: categoryData
        });
    } catch (e) {
        res.status(500).json({ error: "Lỗi tạo danh mục: " + e.message });
    }
};

// 3. XÓA DANH MỤC
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const uid = req.user.uid;

        const docRef = db.collection('categories').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Không tìm thấy danh mục" });
        }

        // Kiểm tra quyền sở hữu (không cho xóa đồ của người khác hoặc đồ hệ thống)
        if (doc.data().uid !== uid) {
            return res.status(403).json({ error: "Bạn không có quyền xóa danh mục mặc định hoặc của người khác" });
        }

        await docRef.delete();
        res.json({ message: "Đã xóa danh mục thành công" });
    } catch (e) {
        res.status(500).json({ error: "Lỗi xóa danh mục: " + e.message });
    }
};