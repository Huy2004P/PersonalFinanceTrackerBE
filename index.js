require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // Load file JSON tĩnh của Huy
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Tạo một route siêu nhẹ để server tự gọi
app.get('/ping', (req, res) => {
    res.status(200).send('Server is alive!');
});

// 2. Thiết lập cơ chế tự gọi chính mình mỗi 14 phút
setInterval(() => {
    // Chỉ tự gọi khi đã deploy lên Render (có SERVER_URL)
    if (SERVER_URL.includes('render.com')) {
        https.get(`${SERVER_URL}/ping`, (res) => {
            if (res.statusCode === 200) {
                console.log('--- Self-ping: Thành công, server vẫn đang thức! ---');
            }
        }).on('error', (err) => {
            console.error('--- Self-ping: Lỗi rồi: ' + err.message + ' ---');
        });
    }
}, 14 * 60 * 1000); // 14 phút một lần (Render ngủ sau 15 phút)

// --- CẤU HÌNH SWAGGER ĐỘNG ---
const SERVER_URL = process.env.RENDER_EXTERNAL_URL 
    ? process.env.RENDER_EXTERNAL_URL 
    : `http://localhost:${process.env.PORT || 3000}`;

swaggerDocument.servers = [
    {
        url: SERVER_URL,
        description: process.env.RENDER_EXTERNAL_URL ? 'Render Production Server' : 'Local Development Server'
    },
    {
        url: "https://identitytoolkit.googleapis.com/v1",
        description: "Firebase Auth API Server"
    }
];

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "LumiFinance API Docs",
    swaggerOptions: {
        persistAuthorization: true,
    }
}));

// --- ROUTES ---
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy tại: ${SERVER_URL}`);
});