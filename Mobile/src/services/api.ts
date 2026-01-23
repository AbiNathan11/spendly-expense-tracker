/**
 * Base API Service
 * Handles HTTP requests with authentication
 */

import { API_URL, API_CONFIG } from '../config/api';
import { getAuthToken } from '../config/supabase';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: Array<{ field: string; message: string }>;
}

class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_URL;
    }

    /**
     * Build headers with authentication
     */
    private async getHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
        const headers: HeadersInit = {
            ...API_CONFIG.headers,
        };

        if (includeAuth) {
            const token = await getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Generic GET request
     */
    async get<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
        try {
            const headers = await this.getHeaders(includeAuth);
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers,
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API GET Error:', error);
            return {
                success: false,
                error: 'Network error. Please check your connection.',
            };
        }
    }

    /**
     * Generic POST request
     */
    async post<T>(
        endpoint: string,
        body: any,
        includeAuth: boolean = true
    ): Promise<ApiResponse<T>> {
        try {
            const headers = await this.getHeaders(includeAuth);
            const url = `${this.baseUrl}${endpoint}`;
            console.log(`API POST: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API POST Error:', error);
            console.error('Endpoint:', endpoint);
            console.error('Base URL:', this.baseUrl);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network request failed',
                message: 'Network error occurred',
            } as ApiResponse<T>;
        }
    }

    /**
     * Generic PUT request
     */
    async put<T>(
        endpoint: string,
        body: any,
        includeAuth: boolean = true
    ): Promise<ApiResponse<T>> {
        try {
            const headers = await this.getHeaders(includeAuth);
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(body),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API PUT Error:', error);
            return {
                success: false,
                error: 'Network error. Please check your connection.',
            };
        }
    }

    /**
     * Generic DELETE request
     */
    async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
        try {
            const headers = await this.getHeaders(includeAuth);
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers,
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API DELETE Error:', error);
            return {
                success: false,
                error: 'Network error. Please check your connection.',
            };
        }
    }

    /**
     * Upload file (for receipt scanning)
     */
    async uploadFile<T>(
        endpoint: string,
        file: any,
        includeAuth: boolean = true
    ): Promise<ApiResponse<T>> {
        try {
            const token = await getAuthToken();
            const formData = new FormData();
            formData.append('receipt', {
                uri: file.uri,
                type: file.type || 'image/jpeg',
                name: file.name || 'receipt.jpg',
            } as any);

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    Authorization: includeAuth && token ? `Bearer ${token}` : '',
                },
                body: formData,
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Upload Error:', error);
            return {
                success: false,
                error: 'Failed to upload file.',
            };
        }
    }
}

export const apiService = new ApiService();
