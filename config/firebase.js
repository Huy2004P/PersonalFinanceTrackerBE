// const admin = require('firebase-admin');
// const serviceAccount = require("../config/personalfinancetracker-ec7dd-firebase-adminsdk-fbsvc-c9efd07e18.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();
// const auth = admin.auth();

// module.exports = { db, auth, admin };

const admin = require('firebase-admin');

// Đọc chuỗi JSON từ biến môi trường
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

try {
  const serviceAccount = JSON.parse(serviceAccountRaw);
  
  // DÒNG QUAN TRỌNG NHẤT: Ép kiểu lại ký tự xuống dòng cho Private Key
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  console.log("Firebase đã nhận chìa khóa xịn!");
} catch (error) {
  console.error("Lỗi cấu hình Firebase:", error);
}