// models/budgetModel.js
const budgetSchema = (data) => {
    const safeData = data || {}; 
    
    return {
        uid: safeData.uid || null,
        categoryId: safeData.categoryId || null,
        categoryName: safeData.categoryName || "Danh mục chưa đặt tên",
        limitAmount: Number(safeData.limitAmount) || 0,
        period: (safeData.period && safeData.period.toLowerCase() === 'weekly') ? 'weekly' : 'monthly',
        createdAt: safeData.createdAt || new Date()
    };
};

module.exports = { budgetSchema };