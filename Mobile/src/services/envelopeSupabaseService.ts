/**
 * Envelope Supabase Service
 * Handles direct database operations for Envelopes
 */

import { supabase, getCurrentUser } from '../config/supabase';

export interface CreateEnvelopeParams {
    name: string;
    budget: number;
    color: string;
}

export interface EnvelopeResponse {
    success: boolean;
    data?: any;
    error?: string;
}

export const createEnvelopeSupabase = async (params: CreateEnvelopeParams): Promise<EnvelopeResponse> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: "User not authenticated" };
        }

        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        const { data, error } = await supabase
            .from('envelopes')
            .insert({
                user_id: user.id,
                name: params.name,
                icon: params.color, // We map 'color' to 'icon' column as per plan
                allocated_amount: params.budget,
                current_balance: params.budget, // Start with full budget
                month: currentMonth,
                year: currentYear
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase Create Envelope Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };

    } catch (e: any) {
        console.error('Create Envelope Exception:', e);
        return { success: false, error: e.message || "An unexpected error occurred" };
    }
};
