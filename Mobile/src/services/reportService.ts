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

export interface YearlyReport {
  period: {
    year: number;
  };
  total_spent: number;
  monthly_breakdown: Array<{
    month: number;
    month_name: string;
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

/*SERVICE*/

class ReportService {
  /**
   * Weekly report
   */
  async getWeeklyReport(date?: string): Promise<ApiResponse<WeeklyReport>> {
    const endpoint = date
      ? `/reports/weekly?date=${date}`
      : `/reports/weekly`;

    return apiService.get<WeeklyReport>(endpoint);
  }

  /**
   * Monthly report
   */
  async getMonthlyReport(
    month: number,
    year: number
  ): Promise<ApiResponse<MonthlyReport>> {
    return apiService.get<MonthlyReport>(
      `/reports/monthly?month=${month}&year=${year}`
    );
  }

  /**
   * Yearly report
   */
  async getYearlyReport(
    year: number
  ): Promise<ApiResponse<YearlyReport>> {
    return apiService.get<YearlyReport>(
      `/reports/yearly?year=${year}`
    );
  }

  /**
   * Download PDF report
   */
  async downloadPdfReport(month: number, year: number): Promise<boolean> {
    try {
      const { baseUrl } = apiService as any;
      const url = `${baseUrl}/reports/pdf?month=${month}&year=${year}`;

      const fileUri = `${FileSystem.documentDirectory}spendly-report-${year}-${month}.pdf`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
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
