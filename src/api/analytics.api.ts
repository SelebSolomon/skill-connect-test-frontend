import { api } from './axios';
import type { ProviderStats, ClientStats } from '../types';

export const analyticsApi = {
  /** Provider performance dashboard stats */
  getProviderStats: (): Promise<ProviderStats> =>
    api.get<ProviderStats>('/analytics/provider').then((r) => r.data),

  /** Client activity dashboard stats */
  getClientStats: (): Promise<ClientStats> =>
    api.get<ClientStats>('/analytics/client').then((r) => r.data),
};
