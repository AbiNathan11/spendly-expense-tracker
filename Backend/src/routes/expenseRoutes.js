const express = require('express');
const { body, query } = require('express-validator');
const { authenticateUser } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getDailyStats
} = require('../controllers/expenseController');

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// GET /api/expenses - Get all expenses (with optional filters)
router.get('/', getExpenses);

// POST /api/expenses - Create new expense
router.post(
    '/',
    [
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
        body('description').notEmpty().withMessage('Description is required'),
        body('envelope_id').notEmpty().withMessage('Envelope ID is required'),
        body('date').isDate().withMessage('Valid date is required'),
        body('shop_name').optional(),
        body('receipt_url').optional().isURL().withMessage('Invalid receipt URL'),
        validate
    ],
    createExpense
);

// PUT /api/expenses/:id - Update expense
router.put(
    '/:id',
    [
        body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
        body('description').optional().notEmpty().withMessage('Description cannot be empty'),
        body('envelope_id').optional().notEmpty().withMessage('Envelope ID cannot be empty'),
        body('date').optional().isDate().withMessage('Valid date is required'),
        validate
    ],
    updateExpense
);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', deleteExpense);

// GET /api/expenses/daily-stats - Get daily spending stats
router.get(
    '/daily-stats',
    [
        query('date').isDate().withMessage('Valid date is required'),
        validate
    ],
    getDailyStats
);

module.exports = router;
