const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Import các Controller
const userController = require('../controllers/userController');
const transactionController = require('../controllers/transactionController');
const categoryController = require('../controllers/categoryController');
const budgetController = require('../controllers/budgetController');
const notificationController = require('../controllers/notificationController');
const walletController = require('../controllers/walletController');

// 1. CÁC ROUTE QUẢN LÝ USER (Hồ sơ & Bảo mật)
router.get('/auth/me', verifyToken, (req, res) => res.json(req.user));
router.post('/users/fcm-token', verifyToken, userController.updateFCMToken);
router.get('/users/profile', verifyToken, userController.getProfile);
router.post('/users/profile', verifyToken, userController.createUserProfile);
router.put('/users/profile', verifyToken, userController.updateProfile);
router.put('/users/password', verifyToken, userController.updatePassword);
router.delete('/users/account', verifyToken, userController.deleteAccount);
router.post('/logout', verifyToken, userController.logout);

// 2. CÁC ROUTE DANH MỤC (CATEGORIES)
router.get('/categories', verifyToken, categoryController.getCategories);
router.post('/categories', verifyToken, categoryController.createCategory);
router.delete('/categories/:id', verifyToken, categoryController.deleteCategory);

// 3. CÁC ROUTE GIAO DỊCH & THỐNG KÊ (TRANSACTIONS)
router.get('/transactions/export-pdf', verifyToken, transactionController.exportPDF);
router.post('/upload', verifyToken, upload.single('image'), transactionController.uploadImage);
router.post('/transactions', verifyToken, transactionController.createTransaction);
router.get('/transactions', verifyToken, transactionController.getTransactions);
router.get('/transactions/:id', verifyToken, transactionController.getTransactionDetail);
router.delete('/transactions/:id', verifyToken, transactionController.deleteTransaction);
router.get('/stats', verifyToken, transactionController.getStats);

// 4. CÁC ROUTE QUẢN LÝ NGÂN SÁCH (BUDGETS) - PHẦN MỚI
router.get('/budgets', verifyToken, budgetController.getBudgets); 
router.post('/budgets', verifyToken, budgetController.createBudget); 
router.delete('/budgets/:id', verifyToken, budgetController.deleteBudget); 

// 5. CÁC ROUTE QUẢN LÝ VÍ (WALLETS) - MỚI
router.get('/wallets', verifyToken, walletController.getWallets);
router.post('/wallets', verifyToken, walletController.createWallet);
router.put('/wallets/:id', verifyToken, walletController.updateWallet);
router.delete('/wallets/:id', verifyToken, walletController.deleteWallet);
router.post('/wallets/transfer', verifyToken, walletController.transferMoney); // Chuyển tiền nội bộ

router.get('/notifications', verifyToken, notificationController.getNotifications);

module.exports = router;