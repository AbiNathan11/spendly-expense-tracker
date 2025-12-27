/**
 * Expense RPC Service
 * Handles complex expense operations using Supabase RPC functions
 */

import { supabase } from '../config/supabase';
import { CreateExpenseData } from './expenseService';

export interface AddExpenseResponse {
    success: boolean;
    new_balance: number;
    daily_spend: number;
    is_overspent: boolean;
    expense_id?: string;
    error?: string;
}

/**
 * Adds an expense using the secure backend RPC function.
 * This ensures atomic updates to both expenses and envelope balances.
 */
export const addExpenseRpc = async (data: CreateExpenseData): Promise<AddExpenseResponse> => {
    try {
        const { data: response, error } = await supabase.rpc('add_expense_and_update_envelope', {
            p_envelope_id: data.envelope_id,
            p_amount: data.amount,
            p_description: data.description,
            p_date: data.date,
            p_shop_name: data.shop_name || null,
            p_receipt_url: data.receipt_url || null
        });

        if (error) {
            console.error('RPC Error:', error);
            return {
                success: false,
                new_balance: 0,
                daily_spend: 0,
                is_overspent: false,
                error: error.message
            };
        }

        // The RPC returns a JSON object directly
        return response as AddExpenseResponse;

    } catch (e: any) {
        console.error('Unexpected Error calling addExpenseRpc:', e);
        return {
            success: false,
            new_balance: 0,
            daily_spend: 0,
            is_overspent: false,
            error: e.message || 'An unexpected error occurred'
        };
    }
};
