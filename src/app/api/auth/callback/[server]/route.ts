/**
 * OAuth Callback Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { oauthManager } from '@/lib/auth/oauth';
import { MCPOrchestrator } from '@/lib/mcp/orchestrator';

const orchestrator = new MCPOrchestrator();

/**
 * GET /api/auth/callback/:server - Handle OAuth callback
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { server: string } }
) {
  try {
    const serverId = params.server;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for errors
    if (error) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/integrations?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/integrations?error=missing_parameters`
      );
    }

    // Exchange code for tokens
    const tokens = await oauthManager.exchangeCodeForTokens(serverId, code, state);

    // Verify state and get user ID
    const oauthState = oauthManager.verifyState(state);
    if (!oauthState) {
      return NextResponse.redirect(
        `${process.env.APP_URL}/integrations?error=invalid_state`
      );
    }

    // Store connection
    const connectionManager = orchestrator.getConnectionManager();
    await connectionManager.addConnection(
      oauthState.userId,
      serverId,
      {
        type: 'oauth',
        accessToken: tokens.access_token,
      },
      {
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      }
    );

    // Redirect back to integrations page
    return NextResponse.redirect(
      `${process.env.APP_URL}/integrations?success=connected&server=${serverId}`
    );
  } catch (error) {
    console.error('[API] OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.APP_URL}/integrations?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'callback_failed'
      )}`
    );
  }
}
