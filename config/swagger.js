const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path'); // Thêm cái này để xử lý đường dẫn

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LumiFinance API Documentation',
      version: '1.0.0',
      description: 'Tài liệu API dành cho dự án tốt nghiệp LumiFinance',
      contact: { name: 'Văn Bá Phát Huy' },
    },
    servers: [
      {
        // Khi lên Vercel, nó sẽ ưu tiên lấy link production
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
        description: 'Server hiện tại',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Sử dụng path.join để Vercel không bị lạc đường khi tìm file
  apis: [path.join(__dirname, './routes/*.js')], 
};

const specs = swaggerJsdoc(options);
module.exports = specs;