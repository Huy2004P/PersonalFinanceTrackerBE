const admin = require('firebase-admin');

const transactionSchema = (data) => {
    return {
        amount: Number(data.amount) || 0,
        type: ['INCOME', 'EXPENSE', 'TRANSFER'].includes(data.type) ? data.type : 'EXPENSE', 
        // Đảm bảo lấy đúng walletId từ request
        walletId: data.walletId || null, 
        toWalletId: data.toWalletId || null, 
        categoryId: data.categoryId || null, 
        categoryName: data.categoryName || data.category || "Khác",
        note: data.note || "",
        imageUrl: data.imageUrl || "",
        date: data.date || new Date().toISOString(),
    };
};

module.exports = { transactionSchema };