/**
 * Base MCP Server Implementation
 * Provides common functionality for all MCP server implementations
 */

import { MCPServer, MCPServerConfig, MCPConnection, MCPCredentials, MCPError } from '@/types/mcp';

export abstract class BaseMCPServer implements MCPServer {
  public readonly config: MCPServerConfig;
  public readonly userId: string;
  protected connection: MCPConnection | null = null;
  protected credentials: MCPCredentials;

  constructor(config: MCPServerConfig, userId: string, credentials: MCPCredentials) {
    this.config = config;
    this.userId = userId;
    this.credentials = credentials;
  }

  /**
   * Validate the connection to the external service
   */
  abstract validateConnection(): Promise<boolean>;

  /**
   * Disconnect from the service
   */
  async disconnect(): Promise<void> {
    this.connection = null;
  }

  /**
   * Refresh expired credentials (for OAuth)
   */
  async refreshCredentials?(): Promise<void> {
    throw new MCPError('Refresh not implemented for this server', 'NOT_IMPLEMENTED', this.config.id);
  }

  /**
   * Handle incoming webhooks
   */
  async handleWebhook?(payload: any): Promise<void> {
    throw new MCPError('Webhooks not implemented for this server', 'NOT_IMPLEMENTED', this.config.id);
  }

  /**
   * Check if rate limit allows request
   */
  protected async checkRateLimit(): Promise<boolean> {
    if (!this.config.rateLimit) return true;

    // TODO: Implement actual rate limiting logic with Redis or in-memory store
    return true;
  }

  /**
   * Log MCP operation for analytics
   */
  protected async logOperation(
    operation: string,
    params: any,
    result: 'success' | 'error',
    duration: number
  ): Promise<void> {
    // TODO: Implement analytics logging
    console.log(`[${this.config.id}] ${operation} - ${result} (${duration}ms)`);
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: any, operation: string): never {
    console.error(`[${this.config.id}] Error in ${operation}:`, error);

    if (error instanceof MCPError) {
      throw error;
    }

    throw new MCPError(
      `${operation} failed: ${error.message}`,
      'OPERATION_ERROR',
      this.config.id,
      { originalError: error }
    );
  }

  /**
   * Execute operation with timing and logging
   */
  protected async executeOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      await this.checkRateLimit();
      const result = await fn();
      const duration = Date.now() - startTime;
      await this.logOperation(operation, {}, 'success', duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logOperation(operation, {}, 'error', duration);
      throw error;
    }
  }

  /**
   * Get access token (handles OAuth and API key auth)
   */
  protected getAccessToken(): string {
    if (this.credentials.type === 'oauth' && this.credentials.accessToken) {
      return this.credentials.accessToken;
    }
    if (this.credentials.type === 'api_key' && this.credentials.apiKey) {
      return this.credentials.apiKey;
    }
    throw new MCPError('No valid credentials found', 'AUTH_ERROR', this.config.id);
  }

  /**
   * Set connection status
   */
  protected setConnection(connection: MCPConnection): void {
    this.connection = connection;
  }

  /**
   * Get current connection status
   */
  public getConnection(): MCPConnection | null {
    return this.connection;
  }
}
