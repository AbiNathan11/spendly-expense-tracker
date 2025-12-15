const { supabase } = require('../config/supabase');
const PDFDocument = require('pdfkit');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } = require('date-fns');

/**
 * Get weekly report
 */
const getWeeklyReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.query;

        const referenceDate = date ? new Date(date) : new Date();
        const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

        // Get all expenses for the week
        const { data: expenses, error } = await supabase
            .from('expenses')
            .select(`
        *,
        envelopes (
          name,
          icon
        )
      `)
            .eq('user_id', userId)
            .gte('date', format(weekStart, 'yyyy-MM-dd'))
            .lte('date', format(weekEnd, 'yyyy-MM-dd'));

        if (error) throw error;

        // Group by day
        const dailyData = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayExpenses = expenses.filter(e => e.date === dayStr);
            const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

            return {
                date: dayStr,
                day: format(day, 'EEEE'),
                total_spent: total,
                transaction_count: dayExpenses.length
            };
        });

        // Group by envelope
        const envelopeData = {};
        expenses.forEach(expense => {
            const envelopeName = expense.envelopes?.name || 'Unknown';
            if (!envelopeData[envelopeName]) {
                envelopeData[envelopeName] = {
                    name: envelopeName,
                    icon: expense.envelopes?.icon || '📦',
                    total: 0,
                    count: 0
                };
            }
            envelopeData[envelopeName].total += expense.amount;
            envelopeData[envelopeName].count += 1;
        });

        const weekTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

        return res.status(200).json({
            success: true,
            data: {
                period: {
                    start: format(weekStart, 'yyyy-MM-dd'),
                    end: format(weekEnd, 'yyyy-MM-dd')
                },
                total_spent: weekTotal,
                daily_breakdown: dailyData,
                envelope_breakdown: Object.values(envelopeData)
            }
        });
    } catch (error) {
        console.error('Get weekly report error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate weekly report'
        });
    }
};

/**
 * Get monthly report
 */
const getMonthlyReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year } = req.query;

        const referenceDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthStart = startOfMonth(referenceDate);
        const monthEnd = endOfMonth(referenceDate);

        // Get all expenses for the month
        const { data: expenses, error: expenseError } = await supabase
            .from('expenses')
            .select(`
        *,
        envelopes (
          name,
          icon
        )
      `)
            .eq('user_id', userId)
            .gte('date', format(monthStart, 'yyyy-MM-dd'))
            .lte('date', format(monthEnd, 'yyyy-MM-dd'));

        if (expenseError) throw expenseError;

        // Get all envelopes for the month
        const { data: envelopes, error: envelopeError } = await supabase
            .from('envelopes')
            .select('*')
            .eq('user_id', userId)
            .eq('month', parseInt(month))
            .eq('year', parseInt(year));

        if (envelopeError) throw envelopeError;

        // Calculate daily status (green/yellow/red)
        const { data: userSettings } = await supabase
            .from('user_settings')
            .select('daily_budget')
            .eq('user_id', userId)
            .single();

        const dailyBudget = userSettings?.daily_budget || 1000; // Default

        const dailyData = eachDayOfInterval({ start: monthStart, end: monthEnd }).map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayExpenses = expenses.filter(e => e.date === dayStr);
            const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

            let status = 'green';
            if (total > dailyBudget) status = 'red';
            else if (total > dailyBudget * 0.8) status = 'yellow';

            return {
                date: dayStr,
                total_spent: total,
                status
            };
        });

        const statusCount = {
            green: dailyData.filter(d => d.status === 'green').length,
            yellow: dailyData.filter(d => d.status === 'yellow').length,
            red: dailyData.filter(d => d.status === 'red').length
        };

        // Envelope breakdown
        const envelopeBreakdown = envelopes.map(env => {
            const spent = env.allocated_amount - env.current_balance;
            return {
                id: env.id,
                name: env.name,
                icon: env.icon,
                allocated: env.allocated_amount,
                spent: spent,
                remaining: env.current_balance,
                percentage: env.allocated_amount > 0 ? (spent / env.allocated_amount * 100).toFixed(2) : 0
            };
        });

        const monthTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

        return res.status(200).json({
            success: true,
            data: {
                period: {
                    month: parseInt(month),
                    year: parseInt(year),
                    start: format(monthStart, 'yyyy-MM-dd'),
                    end: format(monthEnd, 'yyyy-MM-dd')
                },
                total_spent: monthTotal,
                daily_budget: dailyBudget,
                status_count: statusCount,
                daily_breakdown: dailyData,
                envelope_breakdown: envelopeBreakdown
            }
        });
    } catch (error) {
        console.error('Get monthly report error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate monthly report'
        });
    }
};

/**
 * Generate PDF report
 */
const generatePDF = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year } = req.query;

        // Get monthly report data
        const referenceDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthStart = startOfMonth(referenceDate);
        const monthEnd = endOfMonth(referenceDate);

        const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userId)
            .gte('date', format(monthStart, 'yyyy-MM-dd'))
            .lte('date', format(monthEnd, 'yyyy-MM-dd'));

        const { data: envelopes } = await supabase
            .from('envelopes')
            .select('*')
            .eq('user_id', userId)
            .eq('month', parseInt(month))
            .eq('year', parseInt(year));

        const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

        // Create PDF
        const doc = new PDFDocument();

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=spendly-report-${year}-${month}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add content
        doc.fontSize(24).text('Spendly Monthly Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Period: ${format(monthStart, 'MMMM yyyy')}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total Spent: ₹${totalSpent.toFixed(2)}`);
        doc.text(`Total Transactions: ${expenses?.length || 0}`);
        doc.moveDown(2);

        doc.fontSize(16).text('Envelope Breakdown', { underline: true });
        doc.moveDown();

        envelopes?.forEach(env => {
            const spent = env.allocated_amount - env.current_balance;
            doc.fontSize(12).text(`${env.icon} ${env.name}`);
            doc.text(`  Allocated: ₹${env.allocated_amount.toFixed(2)}`);
            doc.text(`  Spent: ₹${spent.toFixed(2)}`);
            doc.text(`  Remaining: ₹${env.current_balance.toFixed(2)}`);
            doc.moveDown();
        });

        doc.moveDown(2);
        doc.fontSize(14).fillColor('green').text('Keep up the great work! 💪', { align: 'center' });
        doc.fontSize(10).fillColor('black').text('Generated by Spendly - Smart Expense Tracker', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Generate PDF error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate PDF report'
        });
    }
};

module.exports = {
    getWeeklyReport,
    getMonthlyReport,
    generatePDF
};
