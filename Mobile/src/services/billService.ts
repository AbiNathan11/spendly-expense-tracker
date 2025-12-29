/**
 * Bill Service – Supabase
 */

import { supabase } from '../config/supabase';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  is_recurring: boolean;
  is_paid: boolean;
  paid_date: string | null;
  month: number;
  year: number;
  created_at: string;
}

class BillService {
  /**
   * Get Bills
   */
  async getBills(month?: number, year?: number) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id);

      if (month) query = query.eq('month', month);
      if (year) query = query.eq('year', year);

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;
      return { data: data as Bill[], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Create Bill
   */
  async createBill(bill: {
    name: string;
    amount: number;
    due_date: string;
    category: string;
    month: number;
    year: number;
    is_recurring?: boolean;
  }) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const billToInsert = {
        ...bill,
        user_id: user.id,
        is_paid: false,
        is_recurring: bill.is_recurring ?? false,
      };

      const { data, error } = await supabase
        .from('bills')
        .insert([billToInsert])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data: data as Bill, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update Bill
   */
  async updateBill(id: string, bill: {
    name?: string;
    amount?: number;
    due_date?: string;
    category?: string;
    is_recurring?: boolean;
  }) {
    try {
      const { data, error } = await supabase
        .from('bills')
        .update(bill)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Bill, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Mark Bill as Paid
   */
  async markBillPaid(billId: string, paid: boolean = true) {
    try {
      const { error } = await supabase
        .from('bills')
        .update({
          is_paid: paid,
          paid_date: paid ? new Date().toISOString() : null
        })
        .eq('id', billId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Delete Bill
   */
  async deleteBill(billId: string) {
    try {
      const { error } = await supabase.from('bills').delete().eq('id', billId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }
}

export const billService = new BillService();
