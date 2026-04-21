const admin = require('firebase-admin');

// Định nghĩa khung xương (Schema) cho User
const userSchema = (data) => {
    return {
        displayName: data.displayName || "",
        phoneNumber: data.phoneNumber || "",
        address: data.address || "",
        birthday: data.birthday || "",
        bio: data.organic || data.bio || "", // Đổi bio thành organic cho khớp thực tế
        gender: data.gender || "",
        organization: data.organization || "",
        avatarUrl: data.avatarUrl || "",
        "e-mail": data["e-mail"] || data.email || "" // Thêm trường e-mail có gạch ngang
    };
};

module.exports = { userSchema };