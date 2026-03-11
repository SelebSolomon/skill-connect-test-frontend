import { api } from './axios';
import type {
  AdminStats,
  AdminUser,
  AdminUsersResult,
  PaginatedResult,
  Job,
  Transaction,
  ReportsListResult,
  ReportStatus,
  TransactionStatus,
  WalletTransaction,
} from '../types';

export const adminApi = {
  // ─── Dashboard ──────────────────────────────────────────────────────────────
  getStats: (): Promise<AdminStats> =>
    api.get<AdminStats>('/admin/stats').then((r) => r.data),

  // ─── Users ──────────────────────────────────────────────────────────────────
  getUsers: (params?: {
    roleName?: string;
    banned?: boolean;
    emailVerified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminUsersResult> =>
    api.get<AdminUsersResult>('/admin/users', { params }).then((r) => r.data),

  getUserById: (userId: string): Promise<AdminUser> =>
    api.get<AdminUser>(`/admin/users/${userId}`).then((r) => r.data),

  banUser: (userId: string, banned: boolean, reason?: string): Promise<AdminUser> =>
    api.patch<AdminUser>(`/admin/users/${userId}/ban`, { banned, reason }).then((r) => r.data),

  verifyProvider: (userId: string, verified: boolean, verificationNotes?: string) =>
    api.patch(`/admin/users/${userId}/verify`, { verified, verificationNotes }).then((r) => r.data),

  // ─── Jobs ────────────────────────────────────────────────────────────────────
  getJobs: (params?: {
    status?: string;
    flagged?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Job>> =>
    api.get<PaginatedResult<Job>>('/admin/jobs', { params }).then((r) => r.data),

  flagJob: (jobId: string, flagged: boolean): Promise<Job> =>
    api.patch<Job>(`/admin/jobs/${jobId}/flag`, { flagged }).then((r) => r.data),

  deleteJob: (jobId: string): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/admin/jobs/${jobId}`).then((r) => r.data),

  // ─── Transactions ─────────────────────────────────────────────────────────────
  getTransactions: (params?: {
    status?: TransactionStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Transaction>> =>
    api.get<PaginatedResult<Transaction>>('/admin/transactions', { params }).then((r) => r.data),

  // ─── Reports ──────────────────────────────────────────────────────────────────
  getReports: (params?: {
    status?: ReportStatus;
    page?: number;
    limit?: number;
  }): Promise<ReportsListResult> =>
    api.get<ReportsListResult>('/admin/reports', { params }).then((r) => r.data),

  resolveReport: (
    reportId: string,
    status: 'reviewed' | 'dismissed' | 'actioned',
    adminNotes?: string,
  ) =>
    api.patch(`/admin/reports/${reportId}/resolve`, { status, adminNotes }).then((r) => r.data),

  // ─── Wallet deposits ──────────────────────────────────────────────────────────
  getPendingDeposits: (params?: { page?: number; limit?: number }): Promise<{ deposits: WalletTransaction[]; total: number; page: number; totalPages: number }> =>
    api.get('/admin/wallet/deposits', { params }).then((r) => r.data),

  approveDeposit: (depositId: string): Promise<WalletTransaction> =>
    api.patch<WalletTransaction>(`/admin/wallet/deposits/${depositId}/approve`).then((r) => r.data),

  rejectDeposit: (depositId: string, note?: string): Promise<WalletTransaction> =>
    api.patch<WalletTransaction>(`/admin/wallet/deposits/${depositId}/reject`, { note }).then((r) => r.data),
};
