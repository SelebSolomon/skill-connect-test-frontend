import { api } from './axios';
import type { UserSettings } from '../types';

export const settingsApi = {
  /** Get settings (auto-creates defaults on first call) */
  getSettings: (): Promise<UserSettings> =>
    api.get<UserSettings>('/settings').then((r) => r.data),

  /** Update notification channel preferences */
  updateNotifications: (dto: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
  }): Promise<UserSettings> =>
    api.patch<UserSettings>('/settings', dto).then((r) => r.data),

  /** Update location sharing preferences */
  updateLocation: (dto: {
    shareLocation?: boolean;
    locationRadius?: number;
  }): Promise<UserSettings> =>
    api.patch<UserSettings>('/settings/location', dto).then((r) => r.data),
};
