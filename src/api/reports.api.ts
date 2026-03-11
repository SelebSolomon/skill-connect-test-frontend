import { api } from './axios';
import type { Report, ReportsListResult, ReportTargetType, ReportReason } from '../types';

export const reportsApi = {
  /** Any authenticated user submits a report */
  submit: (dto: {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    description?: string;
  }): Promise<Report> =>
    api.post<Report>('/reports', dto).then((r) => r.data),

  /** Get reports submitted by the current user */
  getMine: (params?: { page?: number; limit?: number }): Promise<ReportsListResult> =>
    api.get<ReportsListResult>('/reports/mine', { params }).then((r) => r.data),
};
