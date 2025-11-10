import { useState, useEffect, useCallback } from 'react';
import { getRealTimeManager } from '@/lib/realtime/websocket';
import { ChatMessage } from '@/types/chat';

interface UseRealTimeMessagesReturn {
  messages: ChatMessage[];
  sendMessage: (message: Partial<ChatMessage>) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, reactionId: string) => void;
}

export function useRealTimeMessages(
  conversationId: string,
  initialMessages: ChatMessage[] = []
): UseRealTimeMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  useEffect(() => {
    const rtManager = getRealTimeManager();

    // Handle new messages
    const unsubscribeCreated = rtManager.on('message_created', (data: { message: ChatMessage }) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });
    });

    // Handle message updates
    const unsubscribeUpdated = rtManager.on('message_updated', (data: { messageId: string; updates: Partial<ChatMessage> }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, ...data.updates, editedAt: new Date() }
            : msg
        )
      );
    });

    // Handle message deletions
    const unsubscribeDeleted = rtManager.on('message_deleted', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, deletedAt: new Date() }
            : msg
        )
      );
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [conversationId]);

  const sendMessage = useCallback((message: Partial<ChatMessage>) => {
    const rtManager = getRealTimeManager();
    rtManager.sendMessage({
      ...message,
      conversationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }, [conversationId]);

  const editMessage = useCallback((messageId: string, content: string) => {
    const rtManager = getRealTimeManager();
    rtManager.updateMessage(messageId, { content });
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    const rtManager = getRealTimeManager();
    rtManager.deleteMessage(messageId);
  }, []);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    // This would typically make an API call
    const rtManager = getRealTimeManager();
    rtManager.updateMessage(messageId, {
      action: 'add_reaction',
      emoji
    });
  }, []);

  const removeReaction = useCallback((messageId: string, reactionId: string) => {
    const rtManager = getRealTimeManager();
    rtManager.updateMessage(messageId, {
      action: 'remove_reaction',
      reactionId
    });
  }, []);

  return {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
  };
}
