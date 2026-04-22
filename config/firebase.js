// const admin = require('firebase-admin');
// const serviceAccount = require("../config/personalfinancetracker-ec7dd-firebase-adminsdk-fbsvc-c9efd07e18.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();
// const auth = admin.auth();

// module.exports = { db, auth, admin };

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 1. Đường dẫn bí mật trên Render
const renderSecretPath = '/etc/secrets/serviceAccountKey.json';
// 2. Đường dẫn local của Huy (D:\...\config\serviceAccountKey.json)
const localPath = path.join(__dirname, 'serviceAccountKey.json');

// Kiểm tra xem file nào tồn tại thì dùng file đó
const serviceAccountPath = fs.existsSync(renderSecretPath) ? renderSecretPath : localPath;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
    });
    console.log("🔥 Firebase Admin: Đã nạp thành công từ: " + serviceAccountPath);
  } catch (error) {
    console.error("❌ Lỗi Firebase:", error.message);
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };