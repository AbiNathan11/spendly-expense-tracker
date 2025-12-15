/**
 * Validation helper functions
 */

/**
 * Validate envelope icon (should be a single emoji)
 */
const isValidIcon = (icon) => {
    // Simple check for emoji-like characters
    if (!icon || icon.length > 10) return false;
    return true;
};

/**
 * Validate amount (positive number)
 */
const isValidAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
};

/**
 * Validate month (1-12)
 */
const isValidMonth = (month) => {
    const m = parseInt(month);
    return !isNaN(m) && m >= 1 && m <= 12;
};

/**
 * Validate year
 */
const isValidYear = (year) => {
    const y = parseInt(year);
    return !isNaN(y) && y >= 2000 && y <= 2100;
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
    if (!str) return '';
    return str.trim().substring(0, 500); // Max 500 chars
};

module.exports = {
    isValidIcon,
    isValidAmount,
    isValidMonth,
    isValidYear,
    isValidDate,
    sanitizeString
};
