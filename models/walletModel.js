// models/walletModel.js
const admin = require('firebase-admin');

const walletSchema = (data) => {
    return {
        // Tên ví (Tiền mặt, Techcombank...)
        name: data.name || "Ví mới",
        
        // Số dư ban đầu, ép kiểu Number để tính toán
        balance: Number(data.balance) || 0,
        
        // Phân loại ví để hiện Icon bên Flutter
        // CASH: Tiền mặt, BANK: Ngân hàng, SAVINGS: Tiết kiệm
        type: ['CASH', 'BANK', 'SAVINGS'].includes(data.type) ? data.type : 'CASH',
        
        // Mã màu HEX để đồng bộ với apple_design.dart bên Flutter
        color: data.color || "#0071E3", // Mặc định xanh Apple
        
        // Lưu lại thời điểm tạo
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
};

module.exports = { walletSchema };