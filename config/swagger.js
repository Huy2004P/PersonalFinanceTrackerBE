const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LumiFinance API Documentation',
      version: '1.0.0',
      description: 'Tài liệu API dành cho dự án tốt nghiệp LumiFinance - Quản lý tài chính cá nhân',
      contact: {
        name: 'Văn Bá Phát Huy',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Server local để test',
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
  // Đường dẫn tới các file chứa comment định nghĩa API
  apis: ['./routes/*.js'], 
};

const specs = swaggerJsdoc(options);
module.exports = specs;