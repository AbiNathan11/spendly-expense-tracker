const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    scanReceipt,
    uploadReceipt
} = require('../controllers/receiptController');

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// POST /api/receipts/scan - Scan receipt with AI
router.post('/scan', upload.single('receipt'), scanReceipt);

// POST /api/receipts/upload - Upload receipt without scanning
router.post('/upload', upload.single('receipt'), uploadReceipt);

module.exports = router;
