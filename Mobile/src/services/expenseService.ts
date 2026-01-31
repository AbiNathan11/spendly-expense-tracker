/**
 * Expense API Service
 */

import { apiService, ApiResponse } from './api';
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";


export interface Expense {
    id: string;
    user_id: string;
    envelope_id: string;
    amount: number;
    description: string;
    date: string;
    shop_name?: string;
    receipt_url?: string;
    created_at: string;
    updated_at: string;
    envelopes?: {
        id: string;
        name: string;
        icon: string;
    };
}

export interface CreateExpenseData {
    envelope_id: string;
    amount: number;
    description: string;
    date: string;
    shop_name?: string;
    receipt_url?: string;
}

export interface UpdateExpenseData {
    amount?: number;
    description?: string;
    envelope_id?: string;
    date?: string;
    shop_name?: string;
}

export interface DailyStats {
    date: string;
    total_spent: number;
    transaction_count: number;
}

class ExpenseService {
    /**
     * Get all expenses (with optional filters)
     */
    async getExpenses(params?: {
        start_date?: string;
        end_date?: string;
        envelope_id?: string;
    }): Promise<ApiResponse<Expense[]>> {
        let endpoint = '/expenses';

        if (params) {
            const queryParams = new URLSearchParams();
            if (params.start_date) queryParams.append('start_date', params.start_date);
            if (params.end_date) queryParams.append('end_date', params.end_date);
            if (params.envelope_id) queryParams.append('envelope_id', params.envelope_id);

            const queryString = queryParams.toString();
            if (queryString) {
                endpoint += `?${queryString}`;
            }
        }

        return apiService.get<Expense[]>(endpoint);
    }

    /**
     * Create new expense
     */
    async createExpense(data: CreateExpenseData): Promise<ApiResponse<Expense>> {
        return apiService.post<Expense>('/expenses', data);
    }

    /**
     * Update expense
     */
    async updateExpense(id: string, data: UpdateExpenseData): Promise<ApiResponse<Expense>> {
        return apiService.put<Expense>(`/expenses/${id}`, data);
    }

    /**
     * Delete expense
     */
    async deleteExpense(id: string): Promise<ApiResponse<any>> {
        return apiService.delete(`/expenses/${id}`);
    }

    /**
     * Get daily spending statistics
     */
    async getDailyStats(date: string): Promise<ApiResponse<DailyStats>> {
        return apiService.get<DailyStats>(`/expenses/daily-stats?date=${date}`);
    }
}

export const expenseService = new ExpenseService();
