import { useState, useEffect, useCallback } from 'react';
import { getRealTimeManager } from '@/lib/realtime/websocket';
import { User, CursorPosition } from '@/types/chat';

interface UseRealTimePresenceReturn {
  typingUsers: User[];
  presenceUsers: User[];
  userCursors: Map<string, CursorPosition>;
  sendTyping: (isTyping: boolean) => void;
  sendCursor: (position: CursorPosition) => void;
  isConnected: boolean;
}

export function useRealTimePresence(
  conversationId: string,
  userId?: string
): UseRealTimePresenceReturn {
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<User[]>([]);
  const [userCursors, setUserCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId || !conversationId) return;

    const rtManager = getRealTimeManager();

    // Connect to WebSocket
    rtManager.connect(userId, conversationId).catch((error) => {
      console.error('Failed to connect to real-time service:', error);
    });

    // Event handlers
    const unsubscribeConnected = rtManager.on('connected', () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnected = rtManager.on('disconnected', () => {
      setIsConnected(false);
    });

    const unsubscribeTyping = rtManager.on('user_typing', (data: { user: User }) => {
      setTypingUsers((prev) => {
        // Remove if already exists and add to end
        const filtered = prev.filter((u) => u.id !== data.user.id);
        return [...filtered, data.user];
      });

      // Auto-remove typing indicator after 5 seconds
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.id !== data.user.id));
      }, 5000);
    });

    const unsubscribeStoppedTyping = rtManager.on('user_stopped_typing', (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.id !== data.userId));
    });

    const unsubscribeJoined = rtManager.on('user_joined', (data: { user: User }) => {
      setPresenceUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== data.user.id);
        return [...filtered, data.user];
      });
    });

    const unsubscribeLeft = rtManager.on('user_left', (data: { userId: string }) => {
      setPresenceUsers((prev) => prev.filter((u) => u.id !== data.userId));
      setUserCursors((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
    });

    const unsubscribeCursor = rtManager.on('cursor_moved', (data: { userId: string; position: CursorPosition }) => {
      setUserCursors((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.userId, data.position);
        return newMap;
      });
    });

    // Cleanup
    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeTyping();
      unsubscribeStoppedTyping();
      unsubscribeJoined();
      unsubscribeLeft();
      unsubscribeCursor();
    };
  }, [conversationId, userId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    const rtManager = getRealTimeManager();
    rtManager.sendTypingIndicator(isTyping);
  }, []);

  const sendCursor = useCallback((position: CursorPosition) => {
    const rtManager = getRealTimeManager();
    rtManager.sendCursorPosition(position);
  }, []);

  return {
    typingUsers,
    presenceUsers,
    userCursors,
    sendTyping,
    sendCursor,
    isConnected,
  };
}
