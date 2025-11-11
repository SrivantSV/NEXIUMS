import { WebSocketMessage, CursorPosition, User } from '@/types/chat';

type EventCallback = (data: any) => void;

export class RealTimeManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<EventCallback>> = new Map();
  private userId: string = '';
  private conversationId: string = '';
  private isConnecting = false;
  private shouldReconnect = true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.shouldReconnect = false;
        this.disconnect();
      });
    }
  }

  async connect(userId: string, conversationId?: string): Promise<void> {
    if (this.isConnecting) {
      console.log('Connection already in progress');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    this.isConnecting = true;
    this.userId = userId;
    this.conversationId = conversationId || '';

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
        const url = `${wsUrl}/ws?userId=${userId}${conversationId ? `&conversationId=${conversationId}` : ''}`;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.startHeartbeat();
          this.emit('connected', { userId, conversationId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });

          if (this.shouldReconnect) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
            this.ws?.close();
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'user_typing':
        this.emit('user_typing', message.data);
        break;
      case 'user_stopped_typing':
        this.emit('user_stopped_typing', message.data);
        break;
      case 'user_joined':
        this.emit('user_joined', message.data);
        break;
      case 'user_left':
        this.emit('user_left', message.data);
        break;
      case 'message_created':
        this.emit('message_created', message.data);
        break;
      case 'message_updated':
        this.emit('message_updated', message.data);
        break;
      case 'message_deleted':
        this.emit('message_deleted', message.data);
        break;
      case 'cursor_moved':
        this.emit('cursor_moved', message.data);
        break;
      case 'selection_changed':
        this.emit('selection_changed', message.data);
        break;
      case 'heartbeat':
        // Heartbeat response received
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          timestamp: Date.now()
        });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.userId, this.conversationId).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private send(message: Partial<WebSocketMessage>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        userId: this.userId,
        conversationId: this.conversationId,
        timestamp: Date.now()
      }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Public API methods
  sendTypingIndicator(isTyping: boolean): void {
    this.send({
      type: isTyping ? 'user_typing' : 'user_stopped_typing'
    });
  }

  sendCursorPosition(position: CursorPosition): void {
    this.send({
      type: 'cursor_moved',
      data: position
    });
  }

  sendMessage(message: any): void {
    this.send({
      type: 'message_created',
      data: message
    });
  }

  updateMessage(messageId: string, updates: any): void {
    this.send({
      type: 'message_updated',
      data: { messageId, updates }
    });
  }

  deleteMessage(messageId: string): void {
    this.send({
      type: 'message_deleted',
      data: { messageId }
    });
  }

  // Event handling
  on(event: string, callback: EventCallback): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Getters
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): number | undefined {
    return this.ws?.readyState;
  }
}

// Singleton instance
let rtManagerInstance: RealTimeManager | null = null;

export function getRealTimeManager(): RealTimeManager {
  if (typeof window === 'undefined') {
    // Server-side: return a new instance
    return new RealTimeManager();
  }

  if (!rtManagerInstance) {
    rtManagerInstance = new RealTimeManager();
  }

  return rtManagerInstance;
}
