// models/categoryModel.js
const categorySchema = (data) => {
    const safeData = data || {}; 
    
    return {
        name: safeData.name || "Danh mục mới",
        type: (safeData.type && safeData.type.toLowerCase() === 'income') ? 'income' : 'expense',
        uid: safeData.uid || null,
    };
};

module.exports = { categorySchema };