/**
 * Report API Service
 */

import { apiService, ApiResponse } from './api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Get the correct directory path for Expo SDK 54
const getDocumentDirectory = () => {
    // Type assertion to handle expo-file-system v19 API changes
    const fs = FileSystem as any;
    return fs.documentDirectory || fs.cacheDirectory || '';
};

export interface WeeklyReport {
    period: {
        start: string;
        end: string;
    };
    total_spent: number;
    daily_breakdown: Array<{
        date: string;
        day: string;
        total_spent: number;
        transaction_count: number;
    }>;
    envelope_breakdown: Array<{
        name: string;
        icon: string;
        total: number;
        count: number;
    }>;
}

export interface MonthlyReport {
    period: {
        month: number;
        year: number;
        start: string;
        end: string;
    };
    total_spent: number;
    daily_budget: number;
    status_count: {
        green: number;
        yellow: number;
        red: number;
    };
    daily_breakdown: Array<{
        date: string;
        total_spent: number;
        status: 'green' | 'yellow' | 'red';
    }>;
    envelope_breakdown: Array<{
        id: string;
        name: string;
        icon: string;
        allocated: number;
        spent: number;
        remaining: number;
        percentage: string;
    }>;
}

class ReportService {
    /**
     * Get weekly report
     */
    async getWeeklyReport(date?: string): Promise<ApiResponse<WeeklyReport>> {
        const endpoint = date ? `/reports/weekly?date=${date}` : '/reports/weekly';
        return apiService.get<WeeklyReport>(endpoint);
    }

    /**
     * Get monthly report
     */
    async getMonthlyReport(month: number, year: number): Promise<ApiResponse<MonthlyReport>> {
        return apiService.get<MonthlyReport>(`/reports/monthly?month=${month}&year=${year}`);
    }

    /**
     * Download PDF report
     */
    async downloadPdfReport(month: number, year: number): Promise<boolean> {
        try {
            const { baseUrl } = apiService as any;
            const url = `${baseUrl}/reports/pdf?month=${month}&year=${year}`;

            const fileName = `spendly-report-${year}-${month}.pdf`;
            const fileUri = `${getDocumentDirectory()}${fileName}`;

            const downloadResult = await FileSystem.downloadAsync(url, fileUri);

            if (downloadResult.status === 200) {
                // Share the PDF
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadResult.uri);
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('PDF Download Error:', error);
            return false;
        }
    }
}

export const reportService = new ReportService();
