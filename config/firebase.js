const admin = require('firebase-admin');
const serviceAccount = require("../config/personalfinancetracker-ec7dd-firebase-adminsdk-fbsvc-c9efd07e18.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin };