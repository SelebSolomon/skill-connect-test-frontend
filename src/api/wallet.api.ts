import { api } from './axios';
import type { WalletInfo, WalletHistoryResult, WalletTransaction, WalletTransactionType } from '../types';

export const walletApi = {
  /** Get wallet balance + totals */
  getWallet: (): Promise<WalletInfo> =>
    api.get<WalletInfo>('/wallet').then((r) => r.data),

  /** Initialize a Paystack payment for a deposit */
  initializeDeposit: (amount: number): Promise<{ paymentUrl: string; reference: string }> =>
    api.post<{ paymentUrl: string; reference: string }>('/wallet/deposit/initialize', { amount }).then((r) => r.data),

  /** Verify a completed Paystack deposit and credit wallet */
  verifyDeposit: (reference: string): Promise<WalletTransaction> =>
    api.get<WalletTransaction>('/wallet/deposit/verify', { params: { reference } }).then((r) => r.data),

  /** Paginated wallet transaction history */
  getHistory: (params?: {
    type?: WalletTransactionType;
    page?: number;
    limit?: number;
  }): Promise<WalletHistoryResult> =>
    api.get<WalletHistoryResult>('/wallet/history', { params }).then((r) => r.data),
};
