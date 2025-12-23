// /**
//  * Bill API Service
//  */

// import { apiService, ApiResponse } from './api';

// export interface Bill {
//     id: string;
//     user_id: string;
//     name: string;
//     amount: number;
//     due_date: string;
//     category: string;
//     is_recurring: boolean;
//     is_paid: boolean;
//     paid_date?: string;
//     month: number;
//     year: number;
//     created_at: string;
//     updated_at: string;
// }

// export interface CreateBillData {
//     name: string;
//     amount: number;
//     due_date: string;
//     category: string;
//     month: number;
//     year: number;
//     is_recurring?: boolean;
// }

// export interface UpdateBillData {
//     name?: string;
//     amount?: number;
//     due_date?: string;
//     category?: string;
//     is_recurring?: boolean;
// }

// export interface PayBillData {
//     envelope_id?: string;
// }

// class BillService {
//     /**
//      * Get all bills (with optional filters)
//      */
//     async getBills(params?: {
//         month?: number;
//         year?: number;
//         status?: 'paid' | 'unpaid';
//     }): Promise<ApiResponse<Bill[]>> {
//         let endpoint = '/bills';

//         if (params) {
//             const queryParams = new URLSearchParams();
//             if (params.month) queryParams.append('month', params.month.toString());
//             if (params.year) queryParams.append('year', params.year.toString());
//             if (params.status) queryParams.append('status', params.status);

//             const queryString = queryParams.toString();
//             if (queryString) {
//                 endpoint += `?${queryString}`;
//             }
//         }

//         return apiService.get<Bill[]>(endpoint);
//     }

//     /**
//      * Create new bill
//      */
//     async createBill(data: CreateBillData): Promise<ApiResponse<Bill>> {
//         return apiService.post<Bill>('/bills', data);
//     }

//     /**
//      * Update bill
//      */
//     async updateBill(id: string, data: UpdateBillData): Promise<ApiResponse<Bill>> {
//         return apiService.put<Bill>(`/bills/${id}`, data);
//     }

//     /**
//      * Delete bill
//      */
//     async deleteBill(id: string): Promise<ApiResponse<any>> {
//         return apiService.delete(`/bills/${id}`);
//     }

//     /**
//      * Mark bill as paid
//      */
//     async markBillPaid(id: string, data?: PayBillData): Promise<ApiResponse<any>> {
//         return apiService.post(`/bills/${id}/pay`, data || {});
//     }
// }

// export const billService = new BillService();


/**
 * Bill Service – Supabase
 */

import { supabase } from './supabase';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  is_recurring: boolean;
  is_paid: boolean;
  month: number;
  year: number;
  created_at: string;
}

/**
 * Create Bill
 */
export const createBill = async (bill: {
  name: string;
  amount: number;
  due_date: string;
  category: string;
  month: number;
  year: number;
  is_recurring: boolean;
}) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.from('bills').insert([
    {
      ...bill,
      user_id: user.id,
      is_paid: false,
    },
  ]);

  if (error) throw error;
  return data;
};

/**
 * Get Bills (by month & year)
 */
export const getBills = async (month: number, year: number) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', month)
    .eq('year', year)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data as Bill[];
};

/**
 * Mark Bill as Paid
 */
export const markBillAsPaid = async (billId: string) => {
  const { error } = await supabase
    .from('bills')
    .update({ is_paid: true })
    .eq('id', billId);

  if (error) throw error;
};

/**
 * Delete Bill
 */
export const deleteBill = async (billId: string) => {
  const { error } = await supabase.from('bills').delete().eq('id', billId);
  if (error) throw error;
};
