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

const serviceAccount = {
  "type": "service_account",
  "project_id": "personalfinancetracker-ec7dd",
  "private_key_id": "add7ed6eb68bfd7bf53d071534e36ed14e432297",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDDvnT3l9ZCWFRI\ng/hFfCNGCsRx9+Y84epluC/fCZIcHueYh3MBDciWyfsShkVtJ5dThwUkk735dtrL\nBjzU/7S6oLYosYY1D1CQXXK2KPDDEaOUgGi2GlBSZo+DRMELLl+GeFLOq32hN2oy\nvT1OnVKIM1Iniba990Biyx/RyqOdZto01ozSmFAv29w3Qefy4527z+t8Nvcyb3fh\nnq8N2Bg6/QNlz/+wBrpAgX1THVdPwXLuwxTjIJJOEGqmP0IejgJ07ZCsxwfhGtot\n1H8hV3QiiKHi1Qi8wBqAQsymGhoZNNSSWbkK6jGP2g6iX9kpyjyvX2fZWaSxLe+v\nQtwLiIP7AgMBAAECggEALQMahacSW65RL129lUjvGZe3RdfyR3TSAHMi+wCJ61KG\nAlK/dPIU+uvWgxOCWo/8ofYODjO1P2z/8ijsizSD/Fihmuj7yi7L4W7DxrTSbKEd\nQzRmH94cM16nSNHiLG6NA/CeZi0UViLWlnVi6DWQOYbHsRTfg36cfTtlhUo6ZqLN\nk9u5JP/UbIUkR9pDnYJXX8zPTRpWRYdNCPz4ioOW8rSyeNwdm2Z9PrnY++w82mfd\nxaksJmE+Knwd3ZuF853thKCyphAod9EXINxuF19uVnf22gNf3bUwXCqcmyF7a7kl\nZYbrncH47J59ys4m5VVI6zUuggwok+nBSpl+PntvRQKBgQDs0u0iGZ0nmP1PEH9C\nwkBrGVpCxRfMZ7W5wZNT1z2UqD9Iu0HcXhk5Lf5Cyahzyot8FUvvZARljmCMAB/5\nDLj+zkSGrl4sdlfBlRsuEK46wqdtcfqFLhhfUCX7bRQ/aesWCvwrm5M0JJRxnc5x\nnpfdQIMZy8JSE3XpCPRTpi2hlwKBgQDTl/4kCV8nH12qzVC/xzn5kKD5Rt7U6KWJ\nJ8PIJD9Au8diFmLY/EL0NsCfvWg0EcgU+aOwbCM5OvBJTAJL4Oup9amRxgiZx8XB\nZUC4L92OlQjsUK06o8+1Y69gAFyfQLg7qMgZlOvxv13dEfRdxszsVJa29bjGscH1\ntS6xkol1PQKBgDxdc2Zqwv0x6Pd7TAT3QLZL6w7z8CIBGXg02FnZlm/LBv6CBMKo\nFaPWjmX1wwNo0G8bepSVmO1OAlwNOBkiXhFNAHiX/5czvyCv4hK228JMlaK3F9VU\nr4+z/Up+Plf/ppWizS5MZJQ48sGXKOUbOLiD1icAIhMLtNVmm+iqhh0XAoGAc8mt\n2dyDBG6mnCwEbx2/fPEHFcIReGLjCv4GpgQn1O2s+uETMHhCz08S85b7adr9KXU+\nfPGACPZWvVVpwEoRzAzRwSKkXDq03dLhqqkOzdKCcobndLpllHY7ZwZrqP4KkyMW\ndOFIiB7XZ31GwvZh90WGwBIRDjIB2MpQBf4RWGUCgYBolEs2mk08aIEzx/0wwKkN\nauE86A00nrW1fWLScETLFljbXRZdPEix/c+nXXaIRYuu3UPrALYoEWGcCTrIowML\nibhSlhawFbgwbb9WfIyh1ZNBXoJNMiI7Ab+/8q4QWGLazoiqo9WgyV+LlU2Ny58W\ngRAof3A1XYJGjO3ZcMK9TA==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@personalfinancetracker-ec7dd.iam.gserviceaccount.com",
  "client_id": "110346361762452112362",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40personalfinancetracker-ec7dd.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin: Đã kết nối thành công!");
  } catch (error) {
    console.error("Lỗi khởi tạo Firebase:", error.message);
  }
}

// QUAN TRỌNG NHẤT: Huy phải thêm 3 dòng này ở cuối file
const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };