/**
 * OAuth Management System
 * Handles OAuth flows for MCP server connections
 */

import { nanoid } from 'nanoid';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationUrl: string;
  tokenUrl: string;
}

export interface OAuthState {
  state: string;
  serverId: string;
  userId: string;
  createdAt: Date;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

export class OAuthManager {
  private stateStore: Map<string, OAuthState> = new Map();

  /**
   * Get OAuth configuration for a server
   */
  getOAuthConfig(serverId: string): OAuthConfig | null {
    const configs: Record<string, Partial<OAuthConfig>> = {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        redirectUri: `${process.env.APP_URL}/api/auth/callback/github`,
        scopes: ['repo', 'read:user', 'workflow'],
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
      },
      slack: {
        clientId: process.env.SLACK_CLIENT_ID!,
        clientSecret: process.env.SLACK_CLIENT_SECRET!,
        redirectUri: `${process.env.APP_URL}/api/auth/callback/slack`,
        scopes: ['chat:write', 'channels:read', 'users:read', 'files:write', 'search:read'],
        authorizationUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
      },
      notion: {
        clientId: process.env.NOTION_CLIENT_ID!,
        clientSecret: process.env.NOTION_CLIENT_SECRET!,
        redirectUri: `${process.env.APP_URL}/api/auth/callback/notion`,
        scopes: [],
        authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
      },
      linear: {
        clientId: process.env.LINEAR_CLIENT_ID!,
        clientSecret: process.env.LINEAR_CLIENT_SECRET!,
        redirectUri: `${process.env.APP_URL}/api/auth/callback/linear`,
        scopes: ['read', 'write'],
        authorizationUrl: 'https://linear.app/oauth/authorize',
        tokenUrl: 'https://api.linear.app/oauth/token',
      },
      'google-drive': {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: `${process.env.APP_URL}/api/auth/callback/google-drive`,
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/drive.file',
        ],
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
      },
    };

    const config = configs[serverId];
    if (!config || !config.clientId || !config.clientSecret) {
      return null;
    }

    return config as OAuthConfig;
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  generateAuthUrl(serverId: string, userId: string): string {
    const config = this.getOAuthConfig(serverId);
    if (!config) {
      throw new Error(`OAuth not configured for ${serverId}`);
    }

    // Generate state token
    const state = nanoid();
    this.stateStore.set(state, {
      state,
      serverId,
      userId,
      createdAt: new Date(),
    });

    // Clean up old states (older than 10 minutes)
    this.cleanupOldStates();

    // Build authorization URL
    const url = new URL(config.authorizationUrl);
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('response_type', 'code');

    if (config.scopes.length > 0) {
      url.searchParams.set('scope', config.scopes.join(' '));
    }

    // Server-specific parameters
    if (serverId === 'github') {
      url.searchParams.set('allow_signup', 'false');
    }

    return url.toString();
  }

  /**
   * Verify OAuth state
   */
  verifyState(state: string): OAuthState | null {
    const oauthState = this.stateStore.get(state);

    if (!oauthState) {
      return null;
    }

    // Check if state is too old (10 minutes)
    const age = Date.now() - oauthState.createdAt.getTime();
    if (age > 10 * 60 * 1000) {
      this.stateStore.delete(state);
      return null;
    }

    return oauthState;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    serverId: string,
    code: string,
    state: string
  ): Promise<OAuthTokens> {
    const config = this.getOAuthConfig(serverId);
    if (!config) {
      throw new Error(`OAuth not configured for ${serverId}`);
    }

    const oauthState = this.verifyState(state);
    if (!oauthState) {
      throw new Error('Invalid or expired state');
    }

    // Exchange code for tokens
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    });

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const tokens = await response.json();

      // Clean up state
      this.stateStore.delete(state);

      return tokens;
    } catch (error) {
      console.error(`[OAuth] Token exchange failed for ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Refresh OAuth tokens
   */
  async refreshTokens(
    serverId: string,
    refreshToken: string
  ): Promise<OAuthTokens> {
    const config = this.getOAuthConfig(serverId);
    if (!config) {
      throw new Error(`OAuth not configured for ${serverId}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[OAuth] Token refresh failed for ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old OAuth states
   */
  private cleanupOldStates(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [state, oauthState] of this.stateStore.entries()) {
      const age = now - oauthState.createdAt.getTime();
      if (age > maxAge) {
        this.stateStore.delete(state);
      }
    }
  }
}

// Singleton instance
export const oauthManager = new OAuthManager();
