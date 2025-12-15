const express = require('express');
const { body } = require('express-validator');
const { authenticateUser } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
    getBills,
    createBill,
    markBillPaid,
    updateBill,
    deleteBill
} = require('../controllers/billController');

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// GET /api/bills - Get all bills (with optional filters)
router.get('/', getBills);

// POST /api/bills - Create new bill
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
        body('due_date').isDate().withMessage('Valid due date is required'),
        body('category').notEmpty().withMessage('Category is required'),
        body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
        body('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
        body('is_recurring').optional().isBoolean().withMessage('is_recurring must be a boolean'),
        validate
    ],
    createBill
);

// POST /api/bills/:id/pay - Mark bill as paid
router.post(
    '/:id/pay',
    [
        body('envelope_id').optional().notEmpty().withMessage('Envelope ID cannot be empty'),
        validate
    ],
    markBillPaid
);

// PUT /api/bills/:id - Update bill
router.put(
    '/:id',
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
        body('due_date').optional().isDate().withMessage('Valid due date is required'),
        body('category').optional().notEmpty().withMessage('Category cannot be empty'),
        validate
    ],
    updateBill
);

// DELETE /api/bills/:id - Delete bill
router.delete('/:id', deleteBill);

module.exports = router;
