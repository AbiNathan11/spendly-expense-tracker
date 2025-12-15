/**
 * Receipt API Service
 */

import { apiService, ApiResponse } from './api';

export interface ReceiptScanResult {
    total_amount: number;
    shop_name: string;
    date: string;
    category: string;
    suggested_envelope_icon: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    receipt_url: string;
}

export interface ReceiptUploadResult {
    receipt_url: string;
}

class ReceiptService {
    /**
     * Scan receipt with AI
     */
    async scanReceipt(file: {
        uri: string;
        type?: string;
        name?: string;
    }): Promise<ApiResponse<ReceiptScanResult>> {
        return apiService.uploadFile<ReceiptScanResult>('/receipts/scan', file);
    }

    /**
     * Upload receipt without AI scanning
     */
    async uploadReceipt(file: {
        uri: string;
        type?: string;
        name?: string;
    }): Promise<ApiResponse<ReceiptUploadResult>> {
        return apiService.uploadFile<ReceiptUploadResult>('/receipts/upload', file);
    }
}

export const receiptService = new ReceiptService();
