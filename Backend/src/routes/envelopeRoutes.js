const express = require('express');
const { body, query } = require('express-validator');
const { authenticateUser } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
    getEnvelopes,
    createEnvelope,
    updateEnvelope,
    deleteEnvelope,
    getEnvelopeStats
} = require('../controllers/envelopeController');

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// GET /api/envelopes - Get all envelopes
router.get('/', getEnvelopes);

// POST /api/envelopes - Create new envelope
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('icon').notEmpty().withMessage('Icon is required'),
        body('allocated_amount').isFloat({ min: 0 }).withMessage('Allocated amount must be a positive number'),
        body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
        body('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
        validate
    ],
    createEnvelope
);

// PUT /api/envelopes/:id - Update envelope
router.put(
    '/:id',
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('icon').optional().notEmpty().withMessage('Icon cannot be empty'),
        body('allocated_amount').optional().isFloat({ min: 0 }).withMessage('Allocated amount must be a positive number'),
        validate
    ],
    updateEnvelope
);

// DELETE /api/envelopes/:id - Delete envelope
router.delete('/:id', deleteEnvelope);

// GET /api/envelopes/stats - Get envelope statistics
router.get(
    '/stats',
    [
        query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
        query('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
        validate
    ],
    getEnvelopeStats
);

module.exports = router;
