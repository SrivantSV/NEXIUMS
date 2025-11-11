/**
 * MCP Connection Manager
 * Manages connections to external MCP servers
 */

import { nanoid } from 'nanoid';
import {
  MCPConnection,
  MCPCredentials,
  MCPServer,
  MCPServerConfig,
  MCPAuthType,
  MCPError,
} from '@/types/mcp';
import { getMCPServerConfigs } from './server-registry';

export class MCPConnectionManager {
  private connections: Map<string, MCPConnection[]>;

  constructor() {
    this.connections = new Map();
  }

  /**
   * Get all connections for a user
   */
  async getUserConnections(userId: string): Promise<MCPConnection[]> {
    return this.connections.get(userId) || [];
  }

  /**
   * Get specific connection
   */
  async getConnection(
    userId: string,
    serverId: string
  ): Promise<MCPConnection | null> {
    const userConnections = this.connections.get(userId) || [];
    return userConnections.find(c => c.serverId === serverId) || null;
  }

  /**
   * Add new connection
   */
  async addConnection(
    userId: string,
    serverId: string,
    credentials: MCPCredentials,
    metadata?: Record<string, any>
  ): Promise<MCPConnection> {
    const serverConfig = this.getServerConfig(serverId);

    if (!serverConfig) {
      throw new MCPError(`Unknown server: ${serverId}`, 'INVALID_SERVER');
    }

    // Validate credentials
    await this.validateCredentials(credentials, serverConfig.authType);

    const connection: MCPConnection = {
      id: nanoid(),
      userId,
      serverId,
      serverName: serverConfig.name,
      status: 'pending',
      credentials,
      metadata,
      connectedAt: new Date(),
    };

    // Add to connections map
    const userConnections = this.connections.get(userId) || [];
    userConnections.push(connection);
    this.connections.set(userId, userConnections);

    // Test connection
    try {
      const server = await this.createServerInstance(connection);
      const isValid = await server.validateConnection();

      if (isValid) {
        connection.status = 'connected';
        connection.lastUsedAt = new Date();
      } else {
        connection.status = 'error';
      }
    } catch (error) {
      console.error(`[ConnectionManager] Failed to validate connection:`, error);
      connection.status = 'error';
    }

    return connection;
  }

  /**
   * Update connection
   */
  async updateConnection(
    userId: string,
    connectionId: string,
    updates: Partial<MCPConnection>
  ): Promise<MCPConnection | null> {
    const userConnections = this.connections.get(userId) || [];
    const connection = userConnections.find(c => c.id === connectionId);

    if (!connection) {
      return null;
    }

    Object.assign(connection, updates);
    return connection;
  }

  /**
   * Remove connection
   */
  async removeConnection(userId: string, connectionId: string): Promise<boolean> {
    const userConnections = this.connections.get(userId) || [];
    const index = userConnections.findIndex(c => c.id === connectionId);

    if (index === -1) {
      return false;
    }

    userConnections.splice(index, 1);
    this.connections.set(userId, userConnections);

    return true;
  }

  /**
   * Test connection
   */
  async testConnection(userId: string, connectionId: string): Promise<boolean> {
    const connection = (this.connections.get(userId) || []).find(
      c => c.id === connectionId
    );

    if (!connection) {
      throw new MCPError('Connection not found', 'NOT_FOUND');
    }

    try {
      const server = await this.createServerInstance(connection);
      const isValid = await server.validateConnection();

      connection.status = isValid ? 'connected' : 'error';
      connection.lastUsedAt = new Date();

      return isValid;
    } catch (error) {
      connection.status = 'error';
      return false;
    }
  }

  /**
   * Refresh connection credentials (for OAuth)
   */
  async refreshConnection(
    userId: string,
    connectionId: string
  ): Promise<MCPConnection | null> {
    const connection = (this.connections.get(userId) || []).find(
      c => c.id === connectionId
    );

    if (!connection) {
      return null;
    }

    try {
      const server = await this.createServerInstance(connection);

      if (server.refreshCredentials) {
        await server.refreshCredentials();
        connection.status = 'connected';
        connection.lastUsedAt = new Date();
      }

      return connection;
    } catch (error) {
      console.error(`[ConnectionManager] Failed to refresh connection:`, error);
      connection.status = 'error';
      return connection;
    }
  }

  /**
   * Create server instance from connection
   */
  async createServerInstance(connection: MCPConnection): Promise<MCPServer> {
    const serverConfig = this.getServerConfig(connection.serverId);

    if (!serverConfig) {
      throw new MCPError(
        `Unknown server: ${connection.serverId}`,
        'INVALID_SERVER'
      );
    }

    // Dynamically import server implementation
    try {
      const ServerClass = await this.getServerClass(connection.serverId);
      return new ServerClass(serverConfig, connection.userId, connection.credentials);
    } catch (error) {
      console.error(`[ConnectionManager] Failed to create server instance:`, error);
      throw new MCPError(
        `Failed to create server instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SERVER_INIT_ERROR',
        connection.serverId
      );
    }
  }

  /**
   * Get server class by ID
   */
  private async getServerClass(serverId: string): Promise<any> {
    // Dynamic import based on server ID
    switch (serverId) {
      case 'github':
        return (await import('./servers/github')).GitHubMCPServerImpl;
      case 'slack':
        return (await import('./servers/slack')).SlackMCPServerImpl;
      case 'notion':
        return (await import('./servers/notion')).NotionMCPServerImpl;
      case 'linear':
        return (await import('./servers/linear')).LinearMCPServerImpl;
      case 'google-drive':
        return (await import('./servers/google-drive')).GoogleDriveMCPServerImpl;
      default:
        throw new MCPError(`Server ${serverId} not implemented`, 'NOT_IMPLEMENTED');
    }
  }

  /**
   * Get server configuration
   */
  private getServerConfig(serverId: string): MCPServerConfig | null {
    const configs = getMCPServerConfigs();
    return configs.find(c => c.id === serverId) || null;
  }

  /**
   * Validate credentials
   */
  private async validateCredentials(
    credentials: MCPCredentials,
    authType: MCPAuthType
  ): Promise<void> {
    switch (authType) {
      case 'oauth':
        if (!credentials.accessToken) {
          throw new MCPError('OAuth access token required', 'INVALID_CREDENTIALS');
        }
        break;

      case 'api_key':
        if (!credentials.apiKey) {
          throw new MCPError('API key required', 'INVALID_CREDENTIALS');
        }
        break;

      case 'basic':
        if (!credentials.username || !credentials.password) {
          throw new MCPError('Username and password required', 'INVALID_CREDENTIALS');
        }
        break;

      case 'custom':
        if (!credentials.customData) {
          throw new MCPError('Custom credentials required', 'INVALID_CREDENTIALS');
        }
        break;
    }
  }

  /**
   * Get connected server IDs for user
   */
  async getConnectedServerIds(userId: string): Promise<string[]> {
    const connections = this.connections.get(userId) || [];
    return connections
      .filter(c => c.status === 'connected')
      .map(c => c.serverId);
  }

  /**
   * Disconnect all user connections
   */
  async disconnectAll(userId: string): Promise<void> {
    this.connections.delete(userId);
  }
}
