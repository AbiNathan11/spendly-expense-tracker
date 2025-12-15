const { supabase } = require('../config/supabase');

/**
 * Get all envelopes for a user
 */
const getEnvelopes = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('envelopes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Get envelopes error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch envelopes'
        });
    }
};

/**
 * Create a new envelope
 */
const createEnvelope = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, icon, allocated_amount, month, year } = req.body;

        const { data, error } = await supabase
            .from('envelopes')
            .insert([
                {
                    user_id: userId,
                    name,
                    icon,
                    allocated_amount: parseFloat(allocated_amount),
                    current_balance: parseFloat(allocated_amount),
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
        console.error('Create envelope error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create envelope'
        });
    }
};

/**
 * Update an envelope
 */
const updateEnvelope = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, icon, allocated_amount } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (icon) updateData.icon = icon;
        if (allocated_amount !== undefined) {
            updateData.allocated_amount = parseFloat(allocated_amount);
        }

        const { data, error } = await supabase
            .from('envelopes')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Envelope not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Update envelope error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update envelope'
        });
    }
};

/**
 * Delete an envelope
 */
const deleteEnvelope = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('envelopes')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: 'Envelope deleted successfully'
        });
    } catch (error) {
        console.error('Delete envelope error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete envelope'
        });
    }
};

/**
 * Get envelope usage statistics
 */
const getEnvelopeStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year } = req.query;

        const { data, error } = await supabase
            .from('envelopes')
            .select('id, name, allocated_amount, current_balance, icon')
            .eq('user_id', userId)
            .eq('month', parseInt(month))
            .eq('year', parseInt(year));

        if (error) throw error;

        const stats = data.map(envelope => ({
            ...envelope,
            spent: envelope.allocated_amount - envelope.current_balance,
            percentage: envelope.allocated_amount > 0
                ? ((envelope.allocated_amount - envelope.current_balance) / envelope.allocated_amount * 100).toFixed(2)
                : 0
        }));

        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get envelope stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch envelope statistics'
        });
    }
};

module.exports = {
    getEnvelopes,
    createEnvelope,
    updateEnvelope,
    deleteEnvelope,
    getEnvelopeStats
};
