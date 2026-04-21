require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customCssUrl: CSS_URL, // Thêm dòng này để fix lỗi load CSS trên Vercel
    customSiteTitle: "LumiFinance API Docs"
}));
app.use('/api', apiRoutes);
app.get('/', (req, res) => {
    res.send('LumiFinance Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});