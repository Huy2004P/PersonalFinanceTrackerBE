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
  "private_key_id": "c9efd07e1891c4ed0b91d22da1b8b9955b674fde",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDR4YxVOTUp/DE5\nuIeMfLkFGQofVvJ3wg70OoruZ2MiM+s1tIpBxCPr6xXk3X3UNj3q1998GOcSOAsu\nIqS28oGaUl4FXTXOetZFdDZGOP8kiDsQtLD7pcmOkf16/VLpf+bCVmnbYxhDkDqj\nSbyteF7/q5MtolzkXD3Lj8xnh5C+3YhICCbDn629DP7BeWXRyOGRpjf/wjPLdzti\nHVbF8BDVteHmXYyzw0EN+3NNygWoN38LZ9b0AURbcrvHltkEGmsULKUJDEJFJyaF\nai7VjOAUXeXzeeJpur8tjjev67TXPiuJgNCxkxaEY61p59IsxKXezUVVOyi1cu5P\nTxoeyVMTAgMBAAECggEAUu2izF3BUuiR7rOp42m4lXoSVNW/EnC8BeZH1PFG61HG\nYz8FzfyZEPOfgAHAYSRZjLxlUpxoWPuJ91265YqmiPp4qfftdbt1hJXpiA+nSKEH\nbY9nytbz8ABhPsJvi1F9NVZ9lzDtemy3rqNJCOXh63W4vrRDrfuAczlLU7DuEWux\ntTiV6M+LLq9O0L32rperf7BrBMJ69w1lwGghLSPgXRoGgIujtNqiUX31TyGrX4l/\nuQuiKWLqqrasAiz4jJXWhHK2yV/HfagyrQlG5xuEa7L7fiFG+ni6DrKMKmHCvDkY\nSpzPVuRHUl/cgyNPSrJ5nL4bx0mareBbcHpnkzQd8QKBgQDzKphK7ehthmvdG0Dj\nKnF+0lkrGPqug/oO3+LwYH9b7FKQCDoSGNZyZUkHzpnaslqHNjNbyjtqgRFOBw6C\nxYfO/LZnPb/Ab9hXnIdaCeIwo9zLCL67ddcGiVUR/CyMWWkqgPyrfpgnrVVDDJcD\nRXakeegQikMiZ6Gy8XexTn1PaQKBgQDc9Ty8jSXEcoOyFZv/6ihqg6EiZuXktE0r\nQ9aYIWTUGjsyNPTsQrLDryZbHV2ZZ9dNAYLJZDp8hbFt+yCniDrjuS0Se3uiq6Qf\nLq6nMnpRQK5uUJRoVPGvX8GTlisVVRzrkEfcSEnZ9s7/VnxzdQ25HWboCxYPEXPa\n0hz3pEb7GwKBgB5OaLyt+hHsdvUPuH6Xg52yybo9WsD1Ye0IqlgbLsReJ8wbumEX\nB2MqjHeUoEhJgk7nym7ePZmAjI+VAZH63HpHtNQZNhTd27DPqW7nXHGDerkzVdI3\nVZ1S8G9VZpf3bMwHV3ZoSL5pM/8vSoL13VuSdgHZuZRIJjcPMUO/7I5BAoGBALGj\nN0Ee+M4GgnoZhWEpD3USfej6cLh9e8zcrRmBP16F+DFVAdMvjChmF6AI68b5BM6T\n+GGQgrS5hvu0eXw2uaF6rhG91JfjBf9LuH4SxuOr7JAjmCyIngUwJqBQijKMSsPX\nKu6d70Gceq4tCcCIyo+YY7MJtqJGla3GXiN5ntchAoGALD9jqZ0tFwIo+ZdnG+Hu\nmPM68F79qjCyqjBsyTC4X37R/Wpn7u0xlgBj33kPjt0YQylQOXvDSdjwymCpzAJm\nkjXeCmfKrXJHZFOe+63CwHhmYZSzFYmKLhUlAfgKvCcqYbRvyfPGX9/9c6AaEZjn\nMqdNvvRtZ+pX1qaZY49Lrkw=\n-----END PRIVATE KEY-----\n",
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
    console.log("Firebase Admin: Đã kết nối bằng file JSON vật lý thành công!");
  } catch (error) {
    console.error("Lỗi khởi tạo Firebase:", error.message);
  }
}