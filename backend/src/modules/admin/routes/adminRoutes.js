'use strict';
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const sellerController = require('../controllers/sellerManagementController');
const sellerActionController = require('../controllers/sellerActionController');
const productController = require('../controllers/productManagementController');
const orderController = require('../controllers/orderManagementController');
const reviewController = require('../controllers/reviewManagementController');
const pdfController = require('../controllers/pdfController');
const adminProfileController = require('../controllers/adminProfileController');
const upload = require('../../../middleware/upload');
const { verifyAuth, verifyAdmin } = require('../../../middleware/auth');

router.use(verifyAuth);
router.use(verifyAdmin);

// Dashboard stats
router.get('/stats', adminController.getStats);

// Admin profile management
router.get('/profile', adminProfileController.getAdminProfile);
router.put('/profile', adminProfileController.updateAdminProfile);
router.post('/profile/image', upload.single('profileImage'), adminProfileController.uploadProfileImage);

// Seller management — queries
router.get('/sellers', sellerController.getPendingSellers);
router.get('/all-sellers', sellerController.getAllSellers);
// Seller management — actions
router.post('/seller/:uid/approve', sellerActionController.approveSeller);
router.post('/seller/:uid/reject', sellerActionController.rejectSeller);
router.post('/seller/:uid/accept-rejected', sellerActionController.acceptRejectedSeller);
router.post('/seller/:uid/block', sellerActionController.blockSeller);
router.post('/seller/:uid/unblock', sellerActionController.unblockSeller);
router.delete('/seller/:uid', sellerActionController.deleteSeller);
router.delete('/blocked-sellers/all', sellerActionController.deleteAllBlockedSellers);
router.delete('/rejected-sellers/all', sellerActionController.deleteAllRejectedSellers);

// Product management
router.get('/products', productController.getAllProducts);

// Order management
router.get('/orders', orderController.getAllOrders);

// Review & analytics management
router.get('/reviews', reviewController.getAllReviews);
router.get('/seller-analytics', reviewController.getSellerAnalytics);
router.get('/seller/:uid/bank-details', reviewController.getSellerBankDetails);
router.delete('/review/:reviewId', reviewController.deleteReview);

// PDF generation
router.get('/seller/:uid/analytics-pdf', pdfController.generateAnalyticsPDF);
router.get('/seller/:uid/pdf', pdfController.generateInvoicePDF);

module.exports = router;
