const { supabase } = require('../config/supabase');

/**
 * Get all expenses for a user
 */
const getExpenses = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start_date, end_date, envelope_id } = req.query;

        let query = supabase
            .from('expenses')
            .select(`
        *,
        envelopes (
          id,
          name,
          icon
        )
      `)
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (start_date) {
            query = query.gte('date', start_date);
        }
        if (end_date) {
            query = query.lte('date', end_date);
        }
        if (envelope_id) {
            query = query.eq('envelope_id', envelope_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch expenses'
        });
    }
};

/**
 * Create a new expense
 */
const createExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, description, envelope_id, date, shop_name, receipt_url } = req.body;

        // Start a transaction by getting the envelope first
        const { data: envelope, error: envelopeError } = await supabase
            .from('envelopes')
            .select('current_balance')
            .eq('id', envelope_id)
            .eq('user_id', userId)
            .single();

        if (envelopeError || !envelope) {
            return res.status(404).json({
                success: false,
                error: 'Envelope not found'
            });
        }

        // Create the expense
        const { data: expense, error: expenseError } = await supabase
            .from('expenses')
            .insert([
                {
                    user_id: userId,
                    envelope_id,
                    amount: parseFloat(amount),
                    description,
                    date,
                    shop_name,
                    receipt_url
                }
            ])
            .select()
            .single();

        if (expenseError) throw expenseError;

        // Update envelope balance (can go negative)
        const newBalance = envelope.current_balance - parseFloat(amount);

        const { error: updateError } = await supabase
            .from('envelopes')
            .update({ current_balance: newBalance })
            .eq('id', envelope_id)
            .eq('user_id', userId);

        if (updateError) throw updateError;

        return res.status(201).json({
            success: true,
            data: expense
        });
    } catch (error) {
        console.error('Create expense error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create expense'
        });
    }
};

/**
 * Update an expense
 */
const updateExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { amount, description, envelope_id, date, shop_name } = req.body;

        // Get the original expense
        const { data: originalExpense, error: fetchError } = await supabase
            .from('expenses')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !originalExpense) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }

        const updateData = {};
        if (description) updateData.description = description;
        if (date) updateData.date = date;
        if (shop_name !== undefined) updateData.shop_name = shop_name;

        // If amount or envelope changed, we need to adjust balances
        const amountChanged = amount !== undefined && parseFloat(amount) !== originalExpense.amount;
        const envelopeChanged = envelope_id && envelope_id !== originalExpense.envelope_id;

        if (amountChanged || envelopeChanged) {
            // Revert the original expense amount to the old envelope
            const { data: oldEnvelope } = await supabase
                .from('envelopes')
                .select('current_balance')
                .eq('id', originalExpense.envelope_id)
                .single();

            if (oldEnvelope) {
                await supabase
                    .from('envelopes')
                    .update({ current_balance: oldEnvelope.current_balance + originalExpense.amount })
                    .eq('id', originalExpense.envelope_id);
            }

            // Apply the new amount to the new (or same) envelope
            const newEnvelopeId = envelope_id || originalExpense.envelope_id;
            const newAmount = amount !== undefined ? parseFloat(amount) : originalExpense.amount;

            const { data: newEnvelope } = await supabase
                .from('envelopes')
                .select('current_balance')
                .eq('id', newEnvelopeId)
                .single();

            if (newEnvelope) {
                await supabase
                    .from('envelopes')
                    .update({ current_balance: newEnvelope.current_balance - newAmount })
                    .eq('id', newEnvelopeId);
            }

            if (amount !== undefined) updateData.amount = parseFloat(amount);
            if (envelope_id) updateData.envelope_id = envelope_id;
        }

        // Update the expense
        const { data, error } = await supabase
            .from('expenses')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Update expense error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update expense'
        });
    }
};

/**
 * Delete an expense
 */
const deleteExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Get the expense first to refund the envelope
        const { data: expense, error: fetchError } = await supabase
            .from('expenses')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !expense) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }

        // Refund the envelope
        const { data: envelope } = await supabase
            .from('envelopes')
            .select('current_balance')
            .eq('id', expense.envelope_id)
            .single();

        if (envelope) {
            await supabase
                .from('envelopes')
                .update({ current_balance: envelope.current_balance + expense.amount })
                .eq('id', expense.envelope_id);
        }

        // Delete the expense
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Delete expense error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete expense'
        });
    }
};

/**
 * Get daily spending statistics
 */
const getDailyStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.query;

        const { data, error } = await supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', userId)
            .eq('date', date);

        if (error) throw error;

        const totalSpent = data.reduce((sum, expense) => sum + expense.amount, 0);

        return res.status(200).json({
            success: true,
            data: {
                date,
                total_spent: totalSpent,
                transaction_count: data.length
            }
        });
    } catch (error) {
        console.error('Get daily stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch daily statistics'
        });
    }
};

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getDailyStats
};
