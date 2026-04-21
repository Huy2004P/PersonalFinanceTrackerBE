// const admin = require('firebase-admin');
// const serviceAccount = require("../config/personalfinancetracker-ec7dd-firebase-adminsdk-fbsvc-c9efd07e18.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();
// const auth = admin.auth();

// module.exports = { db, auth, admin };

const admin = require('firebase-admin');

// Lấy chuỗi JSON từ biến môi trường mà Huy vừa dán lên Vercel
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccountRaw) {
    try {
        // Parse cái chuỗi đó thành Object
        const serviceAccount = JSON.parse(serviceAccountRaw);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin đã kết nối thành công!");
        }
    } catch (error) {
        console.error("Lỗi khi parse JSON Firebase:", error);
    }
}