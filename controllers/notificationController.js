const { db } = require('../config/firebase');

exports.getNotifications = async (req, res) => {
    try {
        const uid = req.user.uid;
        // Lấy thông báo mới nhất của User này
        const snapshot = await db.collection('notifications')
            .where('uid', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Đếm xem có bao nhiêu cái chưa đọc để làm cái chấm đỏ trên chuông
        const unreadCount = data.filter(n => !n.isRead).length;

        res.json({ status: 'success', data, unreadCount });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};