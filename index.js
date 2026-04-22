require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // Load file JSON tĩnh của Huy

const app = express();
app.use(cors());
app.use(express.json());

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