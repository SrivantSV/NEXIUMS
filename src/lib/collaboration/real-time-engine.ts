import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import {
  CollaborationSession,
  CollaborationOperation,
  CursorPosition,
  TextSelection,
  WebSocketMessage,
  TextInsertOperation,
  TextDeleteOperation,
  TextFormatOperation,
} from '@/types/collaboration';
import { ConflictResolver } from './conflict-resolver';
import { PresenceManager } from './presence-manager';
import { generateId } from '@/lib/utils';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  workspaceId: string;
  sessionIds: Set<string>;
}

/**
 * RealTimeCollaborationEngine - Main engine for real-time collaboration features
 * Manages WebSocket connections, collaboration sessions, and real-time updates
 */
export class RealTimeCollaborationEngine {
  private wsServer: WebSocketServer | null = null;
  private collaborationSessions: Map<string, CollaborationSession> = new Map();
  private clients: Map<string, ClientConnection> = new Map();
  private presenceManager: PresenceManager;
  private conflictResolver: ConflictResolver;

  // Session persistence callbacks
  private sessionPersistenceCallback?: (
    session: CollaborationSession
  ) => Promise<void>;
  private resourceStateCallback?: (
    resourceId: string,
    resourceType: string
  ) => Promise<any>;
  private permissionCheckCallback?: (
    session: CollaborationSession,
    userId: string
  ) => Promise<boolean>;

  constructor() {
    this.presenceManager = new PresenceManager();
    this.conflictResolver = new ConflictResolver();
  }

  /**
   * Setup WebSocket server
   */
  setupWebSocketServer(server?: any): void {
    this.wsServer = new WebSocketServer({
      noServer: true,
      perMessageDeflate: false
    });

    this.wsServer.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    this.wsServer.on('error', (error: Error) => {
      console.error('WebSocket Server Error:', error);
    });
  }

  /**
   * Register callbacks for persistence and permissions
   */
  registerCallbacks(callbacks: {
    persistSession?: (session: CollaborationSession) => Promise<void>;
    getResourceState?: (resourceId: string, resourceType: string) => Promise<any>;
    checkPermissions?: (session: CollaborationSession, userId: string) => Promise<boolean>;
  }): void {
    if (callbacks.persistSession) {
      this.sessionPersistenceCallback = callbacks.persistSession;
    }
    if (callbacks.getResourceState) {
      this.resourceStateCallback = callbacks.getResourceState;
    }
    if (callbacks.checkPermissions) {
      this.permissionCheckCallback = callbacks.checkPermissions;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(
    ws: WebSocket,
    request: IncomingMessage
  ): Promise<void> {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const userId = url.searchParams.get('userId');
    const workspaceId = url.searchParams.get('workspaceId');

    if (!userId || !workspaceId) {
      ws.close(4001, 'Missing userId or workspaceId');
      return;
    }

    const clientId = generateId('client');
    const client: ClientConnection = {
      ws,
      userId,
      workspaceId,
      sessionIds: new Set(),
    };

    this.clients.set(clientId, client);

    // Add user to workspace presence
    await this.presenceManager.addUserToWorkspace(userId, workspaceId);

    // Setup message handler
    ws.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    // Setup close handler
    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    // Setup error handler
    ws.on('error', (error: Error) => {
      console.error(`WebSocket Error for client ${clientId}:`, error);
    });

    // Send welcome message
    await this.sendToClient(clientId, {
      type: 'session_state',
      payload: {
        clientId,
        userId,
        workspaceId,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case 'operation':
          await this.handleOperation(
            message.payload.sessionId,
            message.payload.operation,
            client.userId
          );
          break;

        case 'cursor_update':
          await this.handleCursorUpdate(
            message.payload.sessionId,
            message.payload.cursor,
            client.userId
          );
          break;

        case 'selection_update':
          await this.handleSelectionUpdate(
            message.payload.sessionId,
            message.payload.selection,
            client.userId
          );
          break;

        case 'presence_update':
          await this.presenceManager.updateUserPresence(
            client.userId,
            message.payload.presence
          );
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      await this.sendToClient(clientId, {
        type: 'error',
        payload: {
          message: 'Failed to process message',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle client disconnection
   */
  private async handleDisconnection(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave all collaboration sessions
    for (const sessionId of client.sessionIds) {
      await this.leaveCollaborationSession(sessionId, client.userId);
    }

    // Remove from workspace presence
    await this.presenceManager.removeUserFromWorkspace(
      client.userId,
      client.workspaceId
    );

    // Remove client
    this.clients.delete(clientId);
  }

  /**
   * Create a new collaboration session
   */
  async createCollaborationSession(
    resourceId: string,
    resourceType: 'conversation' | 'artifact' | 'document',
    initiatorId: string,
    workspaceId: string
  ): Promise<CollaborationSession> {
    const state = this.resourceStateCallback
      ? await this.resourceStateCallback(resourceId, resourceType)
      : { text: '', metadata: {} };

    const session: CollaborationSession = {
      id: generateId('session'),
      resourceId,
      resourceType,
      workspaceId,
      participants: [initiatorId],
      state,
      operations: [],
      cursors: new Map(),
      selections: new Map(),
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.collaborationSessions.set(session.id, session);

    return session;
  }

  /**
   * Join a collaboration session
   */
  async joinCollaborationSession(
    sessionId: string,
    userId: string
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error('Collaboration session not found');
    }

    // Check permissions
    if (this.permissionCheckCallback) {
      const hasPermission = await this.permissionCheckCallback(session, userId);
      if (!hasPermission) {
        throw new Error('Permission denied');
      }
    }

    // Add participant if not already in session
    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
    }

    // Find client connection and add session
    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId) {
        client.sessionIds.add(sessionId);
      }
    }

    // Broadcast user joined
    await this.broadcastToSession(sessionId, {
      type: 'user_joined',
      payload: {
        userId,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });

    // Send current state to new participant
    const clientId = this.getClientIdByUserId(userId);
    if (clientId) {
      await this.sendToClient(clientId, {
        type: 'session_state',
        payload: {
          sessionId,
          state: session.state,
          participants: session.participants,
          operations: session.operations.slice(-100), // Last 100 operations
        },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Leave a collaboration session
   */
  async leaveCollaborationSession(
    sessionId: string,
    userId: string
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    // Remove participant
    session.participants = session.participants.filter((id) => id !== userId);

    // Remove cursors and selections
    session.cursors.delete(userId);
    session.selections.delete(userId);

    // Remove session from client
    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId) {
        client.sessionIds.delete(sessionId);
      }
    }

    // Broadcast user left
    await this.broadcastToSession(sessionId, {
      type: 'user_left',
      payload: {
        userId,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });

    // Clean up session if no participants
    if (session.participants.length === 0) {
      this.collaborationSessions.delete(sessionId);
    }
  }

  /**
   * Handle collaboration operation
   */
  async handleOperation(
    sessionId: string,
    operation: CollaborationOperation,
    userId: string
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error('Collaboration session not found');
    }

    // Validate operation
    const isValid = await this.conflictResolver.validateOperation(
      operation,
      session.state
    );

    if (!isValid) {
      throw new Error('Invalid operation');
    }

    // Transform operation if needed (for concurrent edits)
    const transformedOperation = await this.conflictResolver.transform(
      operation,
      session.operations,
      userId
    );

    // Apply operation to session state
    session.state = this.applyOperation(session.state, transformedOperation);
    session.operations.push(transformedOperation);
    session.lastActivity = new Date();

    // Broadcast to all participants (except sender)
    await this.broadcastToSession(
      sessionId,
      {
        type: 'operation',
        payload: {
          operation: transformedOperation,
          userId,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      },
      [userId]
    );

    // Persist changes
    if (this.sessionPersistenceCallback) {
      await this.sessionPersistenceCallback(session);
    }
  }

  /**
   * Apply operation to state
   */
  private applyOperation(state: any, operation: CollaborationOperation): any {
    const newState = { ...state };

    switch (operation.type) {
      case 'text_insert':
        const insertOp = operation as TextInsertOperation;
        const text = newState.text || '';
        newState.text =
          text.slice(0, insertOp.data.position) +
          insertOp.data.text +
          text.slice(insertOp.data.position);
        break;

      case 'text_delete':
        const deleteOp = operation as TextDeleteOperation;
        const currentText = newState.text || '';
        newState.text =
          currentText.slice(0, deleteOp.data.position) +
          currentText.slice(deleteOp.data.position + deleteOp.data.length);
        break;

      case 'text_format':
        const formatOp = operation as TextFormatOperation;
        if (!newState.formatting) {
          newState.formatting = [];
        }
        newState.formatting.push({
          start: formatOp.data.start,
          end: formatOp.data.end,
          format: formatOp.data.format,
        });
        break;
    }

    return newState;
  }

  /**
   * Handle cursor update
   */
  async handleCursorUpdate(
    sessionId: string,
    cursor: CursorPosition,
    userId: string
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    const cursorWithUser: CursorPosition = {
      ...cursor,
      userId,
      timestamp: new Date(),
    };

    session.cursors.set(userId, cursorWithUser);

    // Broadcast cursor position to other participants
    await this.broadcastToSession(
      sessionId,
      {
        type: 'cursor_update',
        payload: {
          userId,
          cursor: cursorWithUser,
        },
        timestamp: new Date(),
      },
      [userId]
    );
  }

  /**
   * Handle selection update
   */
  async handleSelectionUpdate(
    sessionId: string,
    selection: TextSelection,
    userId: string
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    const selectionWithUser: TextSelection = {
      ...selection,
      userId,
      timestamp: new Date(),
    };

    session.selections.set(userId, selectionWithUser);

    // Broadcast selection to other participants
    await this.broadcastToSession(
      sessionId,
      {
        type: 'selection_update',
        payload: {
          userId,
          selection: selectionWithUser,
        },
        timestamp: new Date(),
      },
      [userId]
    );
  }

  /**
   * Broadcast message to all participants in a session
   */
  private async broadcastToSession(
    sessionId: string,
    message: WebSocketMessage,
    excludeUserIds: string[] = []
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    const recipientIds = session.participants.filter(
      (id) => !excludeUserIds.includes(id)
    );

    for (const userId of recipientIds) {
      const clientId = this.getClientIdByUserId(userId);
      if (clientId) {
        await this.sendToClient(clientId, message);
      }
    }
  }

  /**
   * Send message to a specific client
   */
  private async sendToClient(
    clientId: string,
    message: WebSocketMessage
  ): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
    }
  }

  /**
   * Get client ID by user ID
   */
  private getClientIdByUserId(userId: string): string | null {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        return clientId;
      }
    }
    return null;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): CollaborationSession | null {
    return this.collaborationSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.collaborationSessions.values());
  }

  /**
   * Get presence manager
   */
  getPresenceManager(): PresenceManager {
    return this.presenceManager;
  }

  /**
   * Clean up and close all connections
   */
  async shutdown(): Promise<void> {
    // Close all client connections
    for (const client of this.clients.values()) {
      client.ws.close();
    }

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close();
    }

    // Clear all data
    this.clients.clear();
    this.collaborationSessions.clear();
    this.presenceManager.clearAll();
  }
}

// Export singleton instance
export const realTimeEngine = new RealTimeCollaborationEngine();
