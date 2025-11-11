/**
 * WebSocket Authentication
 * Secures WebSocket connections using Supabase authentication
 */

import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/database.types';

export interface AuthenticatedWebSocketClient {
  userId: string;
  userName: string;
  userAvatar?: string;
  profile: UserProfile;
  ws: WebSocket;
  conversationId?: string;
}

/**
 * Authenticate WebSocket connection
 * Validates the access token from the query string or handshake headers
 */
export async function authenticateWebSocket(
  accessToken: string
): Promise<{ user: any; profile: UserProfile } | null> {
  try {
    // Create a Supabase client with the provided access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('WebSocket auth failed:', authError);
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to load profile for WebSocket:', profileError);
      return null;
    }

    // Check if user is active
    if (!profile.is_active) {
      console.error('WebSocket auth failed: User account inactive');
      return null;
    }

    return { user, profile };
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    return null;
  }
}

/**
 * Extract access token from WebSocket URL or headers
 */
export function extractAccessToken(url: string, headers?: Record<string, string>): string | null {
  // Try to get from URL query parameter
  const urlObj = new URL(url);
  const tokenFromQuery = urlObj.searchParams.get('token') || urlObj.searchParams.get('access_token');

  if (tokenFromQuery) {
    return tokenFromQuery;
  }

  // Try to get from headers
  if (headers) {
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }

  return null;
}

/**
 * WebSocket connection handler with authentication
 */
export async function handleWebSocketConnection(
  ws: WebSocket,
  url: string,
  headers?: Record<string, string>
): Promise<AuthenticatedWebSocketClient | null> {
  // Extract access token
  const accessToken = extractAccessToken(url, headers);

  if (!accessToken) {
    console.error('No access token provided for WebSocket connection');
    ws.close(4001, 'Unauthorized: No access token provided');
    return null;
  }

  // Authenticate
  const authResult = await authenticateWebSocket(accessToken);

  if (!authResult) {
    console.error('WebSocket authentication failed');
    ws.close(4001, 'Unauthorized: Invalid access token');
    return null;
  }

  const { user, profile } = authResult;

  // Extract conversation ID from URL if present
  const urlObj = new URL(url);
  const conversationId = urlObj.searchParams.get('conversationId') || undefined;

  // Create authenticated client
  const authenticatedClient: AuthenticatedWebSocketClient = {
    userId: user.id,
    userName: profile.display_name || profile.username || user.email || 'Unknown',
    userAvatar: profile.avatar_url,
    profile,
    ws,
    conversationId,
  };

  console.log(`WebSocket authenticated for user: ${authenticatedClient.userName} (${user.id})`);

  return authenticatedClient;
}

/**
 * Verify if a WebSocket client is authorized to access a conversation
 */
export async function verifyConversationAccess(
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is a participant in the conversation
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to verify conversation access:', error);
    return false;
  }
}

/**
 * Broadcast message to authenticated clients in a conversation
 */
export function broadcastToConversation(
  clients: Map<string, AuthenticatedWebSocketClient>,
  conversationId: string,
  message: any,
  excludeUserId?: string
): void {
  const messageStr = JSON.stringify(message);

  for (const [clientId, client] of clients.entries()) {
    // Skip if not in the same conversation
    if (client.conversationId !== conversationId) {
      continue;
    }

    // Skip excluded user
    if (excludeUserId && client.userId === excludeUserId) {
      continue;
    }

    // Skip if WebSocket is not open
    if (client.ws.readyState !== WebSocket.OPEN) {
      continue;
    }

    try {
      client.ws.send(messageStr);
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
    }
  }
}

/**
 * Send message to a specific user
 */
export function sendToUser(
  clients: Map<string, AuthenticatedWebSocketClient>,
  userId: string,
  message: any
): boolean {
  const messageStr = JSON.stringify(message);
  let sent = false;

  for (const [clientId, client] of clients.entries()) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(messageStr);
        sent = true;
      } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
      }
    }
  }

  return sent;
}

/**
 * Get all authenticated clients for a user
 */
export function getUserClients(
  clients: Map<string, AuthenticatedWebSocketClient>,
  userId: string
): AuthenticatedWebSocketClient[] {
  const userClients: AuthenticatedWebSocketClient[] = [];

  for (const [clientId, client] of clients.entries()) {
    if (client.userId === userId) {
      userClients.push(client);
    }
  }

  return userClients;
}

/**
 * Get all authenticated clients in a conversation
 */
export function getConversationClients(
  clients: Map<string, AuthenticatedWebSocketClient>,
  conversationId: string
): AuthenticatedWebSocketClient[] {
  const conversationClients: AuthenticatedWebSocketClient[] = [];

  for (const [clientId, client] of clients.entries()) {
    if (client.conversationId === conversationId) {
      conversationClients.push(client);
    }
  }

  return conversationClients;
}
