import { api } from './axios';
import type { Notification, NotificationsResult } from '../types';

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationsResult> =>
    api.get<NotificationsResult>('/notifications', { params }).then((r) => r.data),

  getUnreadCount: (): Promise<{ count: number }> =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string): Promise<Notification> =>
    api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: (): Promise<{ message: string }> =>
    api.patch<{ message: string }>('/notifications/read-all').then((r) => r.data),

  clearAll: (): Promise<{ message: string }> =>
    api.delete<{ message: string }>('/notifications').then((r) => r.data),
};
