const { supabase } = require('../config/supabase');

/**
 * Get all bills for a user
 */
const getBills = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year, status } = req.query;

        let query = supabase
            .from('bills')
            .select('*')
            .eq('user_id', userId)
            .order('due_date', { ascending: true });

        if (month) {
            query = query.eq('month', parseInt(month));
        }
        if (year) {
            query = query.eq('year', parseInt(year));
        }
        if (status) {
            query = query.eq('is_paid', status === 'paid');
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get bills error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch bills'
        });
    }
};

/**
 * Create a new bill
 */
const createBill = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, amount, due_date, category, is_recurring, month, year } = req.body;

        const { data, error } = await supabase
            .from('bills')
            .insert([
                {
                    user_id: userId,
                    name,
                    amount: parseFloat(amount),
                    due_date,
                    category,
                    is_recurring: is_recurring || false,
                    is_paid: false,
                    month: parseInt(month),
                    year: parseInt(year)
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Create bill error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create bill'
        });
    }
};

/**
 * Mark bill as paid
 */
const markBillPaid = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { envelope_id } = req.body;

        // Get the bill
        const { data: bill, error: billError } = await supabase
            .from('bills')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (billError || !bill) {
            return res.status(404).json({
                success: false,
                error: 'Bill not found'
            });
        }

        if (bill.is_paid) {
            return res.status(400).json({
                success: false,
                error: 'Bill is already marked as paid'
            });
        }

        // Mark bill as paid
        const { error: updateError } = await supabase
            .from('bills')
            .update({
                is_paid: true,
                paid_date: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId);

        if (updateError) throw updateError;

        // Create an expense entry if envelope_id is provided
        if (envelope_id) {
            // Get envelope
            const { data: envelope, error: envelopeError } = await supabase
                .from('envelopes')
                .select('current_balance')
                .eq('id', envelope_id)
                .eq('user_id', userId)
                .single();

            if (!envelopeError && envelope) {
                // Create expense
                await supabase
                    .from('expenses')
                    .insert([
                        {
                            user_id: userId,
                            envelope_id,
                            amount: bill.amount,
                            description: `Bill payment: ${bill.name}`,
                            date: new Date().toISOString().split('T')[0],
                            shop_name: bill.name
                        }
                    ]);

                // Update envelope balance
                await supabase
                    .from('envelopes')
                    .update({ current_balance: envelope.current_balance - bill.amount })
                    .eq('id', envelope_id);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Bill marked as paid'
        });
    } catch (error) {
        console.error('Mark bill paid error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to mark bill as paid'
        });
    }
};

/**
 * Update a bill
 */
const updateBill = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, amount, due_date, category, is_recurring } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (due_date) updateData.due_date = due_date;
        if (category) updateData.category = category;
        if (is_recurring !== undefined) updateData.is_recurring = is_recurring;

        const { data, error } = await supabase
            .from('bills')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Bill not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Update bill error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update bill'
        });
    }
};

/**
 * Delete a bill
 */
const deleteBill = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('bills')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: 'Bill deleted successfully'
        });
    } catch (error) {
        console.error('Delete bill error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete bill'
        });
    }
};

module.exports = {
    getBills,
    createBill,
    markBillPaid,
    updateBill,
    deleteBill
};
