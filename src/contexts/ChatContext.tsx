'use client';

/**
 * Chat Context Provider
 * Manages chat state, messages, and real-time communication
 * Integrates quota enforcement and feature gates
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from './UserContext';
import { useAI } from './AIContext';
import { checkQuotaLimit, checkModelAccess, checkFeatureAccess } from '@/lib/billing/feature-gates';
import type { ChatMessage } from '@/types/chat';

export interface ChatContextType {
  // Messages
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (messageId: string) => void;
  clearMessages: () => void;

  // Conversation
  conversationId: string | null;
  setConversationId: (id: string | null) => void;

  // Input state
  inputValue: string;
  setInputValue: (value: string) => void;

  // Streaming state
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingContent: string;

  // Send message
  sendMessage: (content: string, options?: SendMessageOptions) => Promise<void>;

  // Real-time connection
  isConnected: boolean;
  connectionError: Error | null;

  // Typing indicators
  typingUsers: Array<{ id: string; name: string }>;

  // Loading states
  loading: boolean;
  error: Error | null;
}

export interface SendMessageOptions {
  model?: string;
  attachments?: File[];
  parentMessageId?: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useUser();
  const { selectedModel, useSmartRouter } = useAI();

  // Message state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');

  // Real-time connection
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<Array<{ id: string; name: string }>>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Add message to state
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    } as ChatMessage;

    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Update message
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
    );
  }, []);

  // Delete message
  const deleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string, options: SendMessageOptions = {}) => {
      if (!user || !profile) {
        setError(new Error('User not authenticated'));
        return;
      }

      if (!content.trim()) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // ===== QUOTA AND FEATURE GATE CHECKS =====

        // 1. Check quota limit
        const tier = profile.subscription_tier || 'free';
        const monthlyRequests = profile.monthly_requests || 0;
        const quotaCheck = checkQuotaLimit(tier, monthlyRequests);

        if (!quotaCheck.allowed) {
          setError(new Error(quotaCheck.reason));
          setLoading(false);
          return;
        }

        // 2. Check smart router access (if needed)
        if (useSmartRouter) {
          const smartRouterCheck = checkFeatureAccess(tier, 'smart-router');
          if (!smartRouterCheck.allowed) {
            setError(new Error(smartRouterCheck.reason));
            setLoading(false);
            return;
          }
        }

        // 3. Check model access (if specific model selected)
        const targetModel = options.model || selectedModel;
        if (targetModel && !useSmartRouter) {
          const modelCheck = checkModelAccess(tier, targetModel);
          if (!modelCheck.allowed) {
            setError(new Error(modelCheck.reason));
            setLoading(false);
            return;
          }
        }

        // ===== END CHECKS =====

        // Add user message
        const userMessage = addMessage({
          conversationId: conversationId || 'default',
          userId: user.id,
          userName: profile.display_name || profile.username || user.email || 'User',
          userAvatar: profile.avatar_url,
          content,
          role: 'user',
        });

        // Clear input
        setInputValue('');

        // Prepare AI request
        const model = options.model || (useSmartRouter ? null : selectedModel);

        // Start streaming
        setIsStreaming(true);
        const assistantMessageId = `msg-${Date.now()}-ai`;
        setStreamingMessageId(assistantMessageId);
        setStreamingContent('');

        // Add placeholder assistant message
        addMessage({
          id: assistantMessageId,
          conversationId: conversationId || 'default',
          userId: 'assistant',
          userName: model || 'AI Assistant',
          content: '',
          role: 'assistant',
        });

        // Call AI API with streaming
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages
              .concat(userMessage)
              .map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
            model,
            stream: true,
            userId: user.id,
            conversationId: conversationId || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.delta) {
                  fullContent += data.delta;
                  setStreamingContent(fullContent);
                  updateMessage(assistantMessageId, { content: fullContent });
                }
                if (data.cost) {
                  updateMessage(assistantMessageId, { cost: data.cost });
                }
                if (data.model) {
                  updateMessage(assistantMessageId, { model: data.model, userName: data.model });
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        setIsStreaming(false);
        setStreamingMessageId(null);
        setStreamingContent('');
      } catch (err) {
        setError(err as Error);
        setIsStreaming(false);
        setStreamingMessageId(null);
        console.error('Failed to send message:', err);
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      profile,
      conversationId,
      messages,
      selectedModel,
      useSmartRouter,
      addMessage,
      updateMessage,
    ]
  );

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !conversationId) return;

    const connectWebSocket = async () => {
      try {
        // Get access token
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('No access token');
        }

        // Connect to WebSocket
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${session.access_token}&conversationId=${conversationId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setConnectionError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            // Handle different message types
            switch (message.type) {
              case 'message_created':
                if (message.data.message.userId !== user.id) {
                  addMessage(message.data.message);
                }
                break;

              case 'message_updated':
                updateMessage(message.data.messageId, message.data.updates);
                break;

              case 'message_deleted':
                deleteMessage(message.data.messageId);
                break;

              case 'user_typing':
                setTypingUsers((prev) => {
                  const exists = prev.find((u) => u.id === message.data.user.id);
                  if (exists) return prev;
                  return [...prev, message.data.user];
                });
                break;

              case 'user_stopped_typing':
                setTypingUsers((prev) => prev.filter((u) => u.id !== message.data.userId));
                break;
            }
          } catch (error) {
            console.error('Failed to handle WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionError(new Error('WebSocket connection error'));
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnectionError(error as Error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, conversationId, addMessage, updateMessage, deleteMessage]);

  const value: ChatContextType = {
    messages,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    conversationId,
    setConversationId,
    inputValue,
    setInputValue,
    isStreaming,
    streamingMessageId,
    streamingContent,
    sendMessage,
    isConnected,
    connectionError,
    typingUsers,
    loading,
    error,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
