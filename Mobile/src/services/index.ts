/**
 * Services Index
 * Export all API services
 */

export { apiService } from './api';
export { envelopeService } from './envelopeService';
export { expenseService } from './expenseService';
export { receiptService } from './receiptService';
export { createBill, getBills, markBillAsPaid, deleteBill } from './billService';
export { reportService } from './reportService';

// Export types
export type { ApiResponse } from './api';
export type { Envelope, EnvelopeStats, CreateEnvelopeData, UpdateEnvelopeData } from './envelopeService';
export type { Expense, CreateExpenseData, UpdateExpenseData, DailyStats } from './expenseService';
export type { ReceiptScanResult, ReceiptUploadResult } from './receiptService';
export type { Bill } from './billService';
export type { WeeklyReport, MonthlyReport } from './reportService';
