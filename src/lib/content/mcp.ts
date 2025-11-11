/**
 * MCP (Model Context Protocol) Integration
 * Orchestrates external tool connections and execution
 */

import { createClient } from '@/lib/supabase/server';
import type {
  MCPServerConfig,
  MCPConnection,
  MCPExecutionRequest,
  MCPExecutionResult,
  MCPServerCategory,
} from '@/types/content';

/**
 * Get all MCP server configurations
 */
export async function getMCPServers(
  category?: MCPServerCategory
): Promise<MCPServerConfig[]> {
  const supabase = await createClient();

  let query = supabase.from('mcp_servers').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('display_name');

  if (error) throw error;

  return data.map(transformServerConfig);
}

/**
 * Get MCP server by ID
 */
export async function getMCPServer(serverId: string): Promise<MCPServerConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mcp_servers')
    .select('*')
    .eq('id', serverId)
    .single();

  if (error) return null;

  return transformServerConfig(data);
}

/**
 * Get user's MCP connections
 */
export async function getUserMCPConnections(userId: string): Promise<MCPConnection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mcp_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'connected')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(transformConnection);
}

/**
 * Create MCP connection
 */
export async function createMCPConnection(data: {
  userId: string;
  serverId: string;
  serverName: string;
  credentials: any;
  metadata?: any;
}): Promise<MCPConnection> {
  const supabase = await createClient();

  const { data: connection, error } = await supabase
    .from('mcp_connections')
    .insert({
      user_id: data.userId,
      server_id: data.serverId,
      server_name: data.serverName,
      credentials: data.credentials,
      metadata: data.metadata || {},
      status: 'connected',
    })
    .select()
    .single();

  if (error) throw error;

  return transformConnection(connection);
}

/**
 * Update MCP connection
 */
export async function updateMCPConnection(
  id: string,
  updates: Partial<{
    status: string;
    credentials: any;
    metadata: any;
  }>
): Promise<MCPConnection> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mcp_connections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return transformConnection(data);
}

/**
 * Delete MCP connection
 */
export async function deleteMCPConnection(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('mcp_connections').delete().eq('id', id);

  if (error) throw error;
}

/**
 * Execute MCP action
 */
export async function executeMCPAction(
  request: MCPExecutionRequest
): Promise<MCPExecutionResult> {
  const startTime = Date.now();

  try {
    // Get connection
    const supabase = await createClient();
    const { data: connection } = await supabase
      .from('mcp_connections')
      .select('*')
      .eq('user_id', request.userId)
      .eq('server_id', request.serverId)
      .eq('status', 'connected')
      .single();

    if (!connection) {
      throw new Error('MCP connection not found or not active');
    }

    // Get server config
    const serverConfig = await getMCPServer(request.serverId);
    if (!serverConfig) {
      throw new Error('MCP server configuration not found');
    }

    // In a real implementation, this would call the actual external service
    // For now, we'll return a mock result
    const result: MCPExecutionResult = {
      success: true,
      data: {
        message: 'MCP action executed successfully (mock)',
        action: request.action,
        parameters: request.parameters,
      },
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };

    // Log execution
    await supabase.from('mcp_executions').insert({
      connection_id: connection.id,
      user_id: request.userId,
      server_id: request.serverId,
      action: request.action,
      parameters: request.parameters,
      result: result.data,
      success: result.success,
      duration: result.duration,
    });

    // Update last used
    await supabase
      .from('mcp_connections')
      .update({ last_used: new Date().toISOString() })
      .eq('id', connection.id);

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'MCP execution failed',
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}

/**
 * Get MCP execution history
 */
export async function getMCPExecutionHistory(params: {
  userId: string;
  connectionId?: string;
  serverId?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: any[]; total: number }> {
  const supabase = await createClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('mcp_executions')
    .select('*', { count: 'exact' })
    .eq('user_id', params.userId);

  if (params.connectionId) {
    query = query.eq('connection_id', params.connectionId);
  }

  if (params.serverId) {
    query = query.eq('server_id', params.serverId);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    items: data,
    total: count || 0,
  };
}

/**
 * Link MCP connection to conversation
 */
export async function linkMCPToConversation(
  connectionId: string,
  conversationId: string
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('conversation_mcp').insert({
    conversation_id: conversationId,
    connection_id: connectionId,
  });
}

/**
 * Get MCP connections for conversation
 */
export async function getConversationMCPConnections(
  conversationId: string
): Promise<MCPConnection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('conversation_mcp')
    .select('connection_id, mcp_connections(*)')
    .eq('conversation_id', conversationId);

  if (error) throw error;

  return data.map((item: any) => transformConnection(item.mcp_connections));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformServerConfig(data: any): MCPServerConfig {
  return {
    id: data.id,
    name: data.name,
    displayName: data.display_name,
    description: data.description,
    category: data.category,
    icon: data.icon,
    website: data.website,
    documentation: data.documentation,
    capabilities: data.capabilities,
    authType: data.auth_type,
    rateLimit: data.rate_limit,
    pricing: data.pricing,
    isEnterprise: data.is_enterprise,
    actions: data.actions,
  };
}

function transformConnection(data: any): MCPConnection {
  return {
    id: data.id,
    userId: data.user_id,
    serverId: data.server_id,
    serverName: data.server_name,
    status: data.status,
    credentials: data.credentials,
    metadata: data.metadata,
    lastUsed: data.last_used ? new Date(data.last_used) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Intent classifier - determines which MCP actions to trigger from user text
 */
export function classifyIntent(
  userMessage: string,
  availableServers: MCPServerConfig[]
): Array<{ serverId: string; action: string; confidence: number }> {
  const intents: Array<{ serverId: string; action: string; confidence: number }> = [];

  const lowerMessage = userMessage.toLowerCase();

  // Simple pattern matching (in production, use ML model)
  const patterns = [
    {
      pattern: /deploy|push|release/i,
      serverId: 'github',
      action: 'deploy',
      confidence: 0.8,
    },
    {
      pattern: /send.*message|notify.*team|post.*slack/i,
      serverId: 'slack',
      action: 'send-message',
      confidence: 0.9,
    },
    {
      pattern: /create.*issue|new.*task|add.*ticket/i,
      serverId: 'linear',
      action: 'create-issue',
      confidence: 0.85,
    },
    {
      pattern: /search.*code|find.*function|look.*repository/i,
      serverId: 'github',
      action: 'search-code',
      confidence: 0.8,
    },
  ];

  for (const pattern of patterns) {
    if (pattern.pattern.test(lowerMessage)) {
      const serverExists = availableServers.some((s) => s.id === pattern.serverId);
      if (serverExists) {
        intents.push({
          serverId: pattern.serverId,
          action: pattern.action,
          confidence: pattern.confidence,
        });
      }
    }
  }

  return intents.sort((a, b) => b.confidence - a.confidence);
}
