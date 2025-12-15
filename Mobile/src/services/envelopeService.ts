/**
 * Envelope API Service
 */

import { apiService, ApiResponse } from './api';

export interface Envelope {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    allocated_amount: number;
    current_balance: number;
    month: number;
    year: number;
    created_at: string;
    updated_at: string;
}

export interface EnvelopeStats extends Envelope {
    spent: number;
    percentage: string;
}

export interface CreateEnvelopeData {
    name: string;
    icon: string;
    allocated_amount: number;
    month: number;
    year: number;
}

export interface UpdateEnvelopeData {
    name?: string;
    icon?: string;
    allocated_amount?: number;
}

class EnvelopeService {
    /**
     * Get all envelopes
     */
    async getEnvelopes(): Promise<ApiResponse<Envelope[]>> {
        return apiService.get<Envelope[]>('/envelopes');
    }

    /**
     * Create new envelope
     */
    async createEnvelope(data: CreateEnvelopeData): Promise<ApiResponse<Envelope>> {
        return apiService.post<Envelope>('/envelopes', data);
    }

    /**
     * Update envelope
     */
    async updateEnvelope(id: string, data: UpdateEnvelopeData): Promise<ApiResponse<Envelope>> {
        return apiService.put<Envelope>(`/envelopes/${id}`, data);
    }

    /**
     * Delete envelope
     */
    async deleteEnvelope(id: string): Promise<ApiResponse<any>> {
        return apiService.delete(`/envelopes/${id}`);
    }

    /**
     * Get envelope statistics
     */
    async getEnvelopeStats(month: number, year: number): Promise<ApiResponse<EnvelopeStats[]>> {
        return apiService.get<EnvelopeStats[]>(`/envelopes/stats?month=${month}&year=${year}`);
    }
}

export const envelopeService = new EnvelopeService();
