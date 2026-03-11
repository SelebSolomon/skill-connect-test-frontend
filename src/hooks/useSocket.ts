import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

export function useSocket() {
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const socketBaseUrl =
      import.meta.env.VITE_SOCKET_BASE_URL ||
      (import.meta.env.PROD
        ? 'https://skill-connect-test-1.onrender.com'
        : 'http://localhost:5000');
    const socket = io(`${socketBaseUrl}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('exception', (err: { message: string }) => {
      console.error('[Socket]', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken]);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:join', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:leave', { conversationId });
  }, []);

  const on = useCallback(
    <T>(event: string, handler: (data: T) => void) => {
      socketRef.current?.on(event, handler);
      return () => { socketRef.current?.off(event, handler); };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConnected],
  );

  return {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    leaveConversation,
    on,
  };
}
