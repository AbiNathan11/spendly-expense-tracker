/**
 * Date utilities for Spendly
 */

const { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

/**
 * Get formatted date string
 */
const formatDate = (date, formatString = 'yyyy-MM-dd') => {
    return format(new Date(date), formatString);
};

/**
 * Get week boundaries
 */
const getWeekBoundaries = (date = new Date()) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 });

    return {
        start: formatDate(start),
        end: formatDate(end)
    };
};

/**
 * Get month boundaries
 */
const getMonthBoundaries = (month, year) => {
    const date = new Date(year, month - 1, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    return {
        start: formatDate(start),
        end: formatDate(end)
    };
};

/**
 * Get current month and year
 */
const getCurrentMonthYear = () => {
    const now = new Date();
    return {
        month: now.getMonth() + 1,
        year: now.getFullYear()
    };
};

/**
 * Check if date is today
 */
const isToday = (date) => {
    const today = formatDate(new Date());
    const checkDate = formatDate(date);
    return today === checkDate;
};

module.exports = {
    formatDate,
    getWeekBoundaries,
    getMonthBoundaries,
    getCurrentMonthYear,
    isToday
};
