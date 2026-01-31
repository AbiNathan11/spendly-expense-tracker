const express = require('express');
const { query } = require('express-validator');
const { authenticateUser } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
    getWeeklyReport,
    getMonthlyReport,
    getYearlyReport,
    generatePDF
} = require('../controllers/reportController');

const router = express.Router();

router.use(authenticateUser);

router.get('/weekly', [query('date').optional().isDate().withMessage('Valid date is required'), validate], getWeeklyReport);
router.get('/monthly', [query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'), query('year').isInt({ min: 2000 }).withMessage('Valid year is required'), validate], getMonthlyReport);
router.get('/yearly', [query('year').isInt({ min: 2000 }).withMessage('Valid year is required'), validate], getYearlyReport);
router.get('/pdf', [query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'), query('year').isInt({ min: 2000 }).withMessage('Valid year is required'), validate], generatePDF);

module.exports = router;
