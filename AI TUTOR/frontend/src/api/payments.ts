import apiClient from './client';
import type { Payment } from '../types';

export interface PaymentHistoryResponse {
  data: Payment[];
  total: number;
  page: number;
  size: number;
}

export interface RefundRequest {
  reason?: string;
}

export const paymentsApi = {
  // Get payment history
  getPaymentHistory: async (page = 1, size = 20): Promise<PaymentHistoryResponse> => {
    const response = await apiClient.get('/payments/history', {
      params: { page, size }
    });
    return response.data;
  },

  // Refund a payment (admin only)
  refundPayment: async (paymentId: number, refundData: RefundRequest): Promise<{ message: string }> => {
    const response = await apiClient.post(`/payments/${paymentId}/refund`, refundData);
    return response.data;
  },
};
