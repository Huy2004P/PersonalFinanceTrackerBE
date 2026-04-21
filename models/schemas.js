// models/schemas.js
const UserProfile = {
    email: "string",
    displayName: "string",
    phoneNumber: "string",
    address: "string",
    birthday: "string (YYYY-MM-DD)",
    bio: "string",
    gender: "string",
    organization: "string",
    avatarUrl: "string",
    createdAt: "timestamp",
    updatedAt: "timestamp"
};

const Transaction = {
    uid: "string",
    walletId: "string (Liên kết với Wallet)", // Ngăn chứa tiền
    amount: "number",
    type: "EXPENSE | INCOME | TRANSFER", // Thêm TRANSFER cho chuyển khoản
    categoryId: "string",
    categoryName: "string",
    note: "string",
    date: "timestamp/string",
    imageUrl: "string",
    createdAt: "timestamp"
};

const Category = {
    name: "string",
    type: "expense | income",
    uid: "string (chủ sở hữu/null nếu là mặc định)",
    createdAt: "timestamp"
};

const Budget = {
    uid: "string (chủ sở hữu)",
    categoryId: "string (Liên kết với Category)",
    categoryName: "string (Để hiển thị nhanh trên UI)",
    limitAmount: "number (Số tiền tối đa định tiêu)",
    period: "string (monthly | weekly)", // Chu kỳ ngân sách
    createdAt: "timestamp"
};

const Wallet = {
    uid: "string (chủ sở hữu)",
    name: "string (Ví dụ: Tiền mặt, ATM...)",
    balance: "number (Số dư hiện tại)",
    type: "CASH | BANK | SAVINGS",
    color: "string (Mã màu HEX cho UI)",
    createdAt: "timestamp"
};

module.exports = { UserProfile, Transaction, Category, Budget, Wallet };