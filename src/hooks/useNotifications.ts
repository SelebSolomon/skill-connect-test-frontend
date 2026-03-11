import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { notificationsApi } from '../api/notifications.api';
import type { Notification, NotificationsResult } from '../types';

const QUERY_KEY = ['notifications'] as const;

export function useNotifications() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  // ─── Initial fetch ──────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationsApi.getAll({ page: 1, limit: 30 }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // ─── Real-time socket ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !isAuthenticated) return;

    const socket = io('http://localhost:5000/notifications', {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    /** New notification pushed from server → prepend to cache */
    socket.on('notification:new', (notification: Notification) => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: [notification, ...prev.notifications],
          total: prev.total + 1,
          unreadCount: prev.unreadCount + 1,
        };
      });
    });

    /** Another tab marked all as read — sync this tab's badge */
    socket.on('notification:all_read', () => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unreadCount: 0,
          notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        };
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, isAuthenticated, queryClient]);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (prev) => {
        if (!prev) return prev;
        const wasUnread = prev.notifications.find((n) => n._id === id && !n.isRead);
        return {
          ...prev,
          unreadCount: wasUnread ? Math.max(prev.unreadCount - 1, 0) : prev.unreadCount,
          notifications: prev.notifications.map((n) =>
            n._id === id ? { ...n, isRead: true } : n,
          ),
        };
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unreadCount: 0,
          notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        };
      });
      // Tell the server to broadcast all_read to other tabs
      socketRef.current?.emit('notification:read_all');
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => notificationsApi.clearAll(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (prev) =>
        prev ? { ...prev, notifications: [], total: 0, unreadCount: 0 } : prev,
      );
    },
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    clearAll: () => clearAllMutation.mutate(),
    isMarkingAll: markAllAsReadMutation.isPending,
    isClearing: clearAllMutation.isPending,
  };
}
