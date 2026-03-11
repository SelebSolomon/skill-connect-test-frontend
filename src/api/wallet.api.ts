import { api } from './axios';
import type { WalletInfo, WalletHistoryResult, WalletTransaction, WalletTransactionType } from '../types';

export const walletApi = {
  /** Get wallet balance + totals */
  getWallet: (): Promise<WalletInfo> =>
    api.get<WalletInfo>('/wallet').then((r) => r.data),

  /** Submit a deposit request with an optional proof image */
  requestDeposit: (formData: FormData): Promise<WalletTransaction> =>
    api.post<WalletTransaction>('/wallet/deposit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  /** Paginated wallet transaction history */
  getHistory: (params?: {
    type?: WalletTransactionType;
    page?: number;
    limit?: number;
  }): Promise<WalletHistoryResult> =>
    api.get<WalletHistoryResult>('/wallet/history', { params }).then((r) => r.data),
};
