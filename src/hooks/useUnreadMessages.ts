import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { conversationsApi } from '../api/conversations.api';
import type { Conversation } from '../types';

const CONV_KEY = ['conversations'] as const;

export function useUnreadMessages(): number {
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const { data: conversations } = useQuery({
    queryKey: CONV_KEY,
    queryFn: conversationsApi.listConversations,
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: 60_000, // fallback poll when socket is down
  });

  // Total unread across all conversations
  const totalUnread = (conversations ?? []).reduce(
    (sum: number, c: Conversation) => sum + (typeof c.unread === 'number' ? c.unread : 0),
    0,
  );

  // Listen for message:new on the /chat socket — increment badge without
  // needing to re-fetch the full conversations list
  useEffect(() => {
    if (!accessToken || !isAuthenticated) return;

    const base =
      import.meta.env.VITE_SOCKET_BASE_URL ||
      (import.meta.env.PROD ? '' : 'http://localhost:5000');

    const socket = io(`${base}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('message:new', (msg: { conversationId: string; senderId: string }) => {
      // Only increment if the message is from someone else
      if (msg.senderId === user?.sub) return;

      queryClient.setQueryData<Conversation[]>(CONV_KEY, (prev) => {
        if (!prev) return prev;
        return prev.map((c) =>
          c._id === msg.conversationId
            ? { ...c, unread: (typeof c.unread === 'number' ? c.unread : 0) + 1 }
            : c,
        );
      });
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, isAuthenticated, user?.sub, queryClient]);

  return totalUnread;
}
