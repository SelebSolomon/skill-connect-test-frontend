import { api } from './axios';
import type { MyTransactionsResult, PlatformSummary, Transaction } from '../types';

export const transactionsApi = {
  // Provider: own commission ledger
  getMy: (params?: { page?: number; limit?: number }): Promise<MyTransactionsResult> =>
    api.get<MyTransactionsResult>('/transactions/my', { params }).then((r) => r.data),

  // Admin
  getAll: (params?: { page?: number; limit?: number; status?: string }): Promise<{ transactions: Transaction[]; total: number; page: number; totalPages: number }> =>
    api
      .get<{ transactions: Transaction[]; total: number; page: number; totalPages: number }>(
        '/transactions',
        { params },
      )
      .then((r) => r.data),

  getSummary: (): Promise<PlatformSummary> =>
    api.get<PlatformSummary>('/transactions/summary').then((r) => r.data),

  markAsPaid: (id: string, paymentReference?: string): Promise<Transaction> =>
    api.patch<Transaction>(`/transactions/${id}/mark-paid`, { paymentReference }).then((r) => r.data),

  waive: (id: string, reason?: string): Promise<Transaction> =>
    api.patch<Transaction>(`/transactions/${id}/waive`, { reason }).then((r) => r.data),

  // Provider: Paystack payment
  initializePayment: (id: string): Promise<{ paymentUrl: string; reference: string }> =>
    api
      .post<{ paymentUrl: string; reference: string }>(`/transactions/${id}/pay/initialize`)
      .then((r) => r.data),

  verifyPayment: (reference: string): Promise<Transaction> =>
    api.get<Transaction>('/transactions/pay/verify', { params: { reference } }).then((r) => r.data),
};
