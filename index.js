require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const swaggerSpec = require('./config/swagger');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(cors());

// Phải đặt TRƯỚC app.use('/api', apiRoutes)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // Thêm dòng này để hỗ trợ form-data nếu cần

// Sử dụng Routes
app.use('/api', apiRoutes);
// Trang tài liệu API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});