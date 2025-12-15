/**
 * Bill API Service
 */

import { apiService, ApiResponse } from './api';

export interface Bill {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    due_date: string;
    category: string;
    is_recurring: boolean;
    is_paid: boolean;
    paid_date?: string;
    month: number;
    year: number;
    created_at: string;
    updated_at: string;
}

export interface CreateBillData {
    name: string;
    amount: number;
    due_date: string;
    category: string;
    month: number;
    year: number;
    is_recurring?: boolean;
}

export interface UpdateBillData {
    name?: string;
    amount?: number;
    due_date?: string;
    category?: string;
    is_recurring?: boolean;
}

export interface PayBillData {
    envelope_id?: string;
}

class BillService {
    /**
     * Get all bills (with optional filters)
     */
    async getBills(params?: {
        month?: number;
        year?: number;
        status?: 'paid' | 'unpaid';
    }): Promise<ApiResponse<Bill[]>> {
        let endpoint = '/bills';

        if (params) {
            const queryParams = new URLSearchParams();
            if (params.month) queryParams.append('month', params.month.toString());
            if (params.year) queryParams.append('year', params.year.toString());
            if (params.status) queryParams.append('status', params.status);

            const queryString = queryParams.toString();
            if (queryString) {
                endpoint += `?${queryString}`;
            }
        }

        return apiService.get<Bill[]>(endpoint);
    }

    /**
     * Create new bill
     */
    async createBill(data: CreateBillData): Promise<ApiResponse<Bill>> {
        return apiService.post<Bill>('/bills', data);
    }

    /**
     * Update bill
     */
    async updateBill(id: string, data: UpdateBillData): Promise<ApiResponse<Bill>> {
        return apiService.put<Bill>(`/bills/${id}`, data);
    }

    /**
     * Delete bill
     */
    async deleteBill(id: string): Promise<ApiResponse<any>> {
        return apiService.delete(`/bills/${id}`);
    }

    /**
     * Mark bill as paid
     */
    async markBillPaid(id: string, data?: PayBillData): Promise<ApiResponse<any>> {
        return apiService.post(`/bills/${id}/pay`, data || {});
    }
}

export const billService = new BillService();
