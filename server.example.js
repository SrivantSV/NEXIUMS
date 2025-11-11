/**
 * Example WebSocket Server for Nexus AI Chat
 *
 * This is a standalone WebSocket server that can run alongside your Next.js app.
 *
 * To use:
 * 1. Install dependencies: npm install ws
 * 2. Run this server: node server.js
 * 3. Update NEXT_PUBLIC_WS_URL in .env to ws://localhost:8080
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const PORT = process.env.WS_PORT || 8080;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map(); // userId -> { ws, conversationId, userName }
const conversations = new Map(); // conversationId -> Set of userIds

// Broadcast to all clients in a conversation
function broadcastToConversation(conversationId, message, excludeUserId = null) {
  const userIds = conversations.get(conversationId);
  if (!userIds) return;

  const messageStr = JSON.stringify(message);

  userIds.forEach((userId) => {
    if (userId !== excludeUserId) {
      const client = clients.get(userId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    }
  });
}

wss.on('connection', (ws, req) => {
  const params = url.parse(req.url, true).query;
  const userId = params.userId;
  const conversationId = params.conversationId;

  console.log(`New connection: userId=${userId}, conversationId=${conversationId}`);

  if (!userId) {
    ws.close(1008, 'userId is required');
    return;
  }

  // Store client
  clients.set(userId, {
    ws,
    conversationId,
    userName: params.userName || `User ${userId}`,
  });

  // Add to conversation
  if (conversationId) {
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, new Set());
    }
    conversations.get(conversationId).add(userId);

    // Notify others that user joined
    broadcastToConversation(
      conversationId,
      {
        type: 'user_joined',
        data: {
          user: {
            id: userId,
            displayName: params.userName || `User ${userId}`,
            status: 'online',
          },
        },
        timestamp: Date.now(),
      },
      userId
    );
  }

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received:', message.type, 'from', userId);

      // Broadcast to conversation
      if (conversationId) {
        broadcastToConversation(conversationId, message, userId);
      }

      // Handle heartbeat
      if (message.type === 'heartbeat') {
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log(`Disconnected: userId=${userId}`);

    // Remove from conversation
    if (conversationId) {
      const userIds = conversations.get(conversationId);
      if (userIds) {
        userIds.delete(userId);
        if (userIds.size === 0) {
          conversations.delete(conversationId);
        } else {
          // Notify others that user left
          broadcastToConversation(conversationId, {
            type: 'user_left',
            data: { userId },
            timestamp: Date.now(),
          });
        }
      }
    }

    // Remove client
    clients.delete(userId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for userId=${userId}:`, error);
  });

  // Send initial connection confirmation
  ws.send(
    JSON.stringify({
      type: 'connected',
      data: { userId, conversationId },
      timestamp: Date.now(),
    })
  );
});

// Start server
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  console.log(`WebSocket URL: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
