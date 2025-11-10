/**
 * OAuth Authorization Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { oauthManager } from '@/lib/auth/oauth';

/**
 * GET /api/auth/oauth/:server - Start OAuth flow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { server: string } }
) {
  try {
    const serverId = params.server;
    const userId = request.headers.get('x-user-id') || 'demo-user';

    // Generate authorization URL
    const authUrl = oauthManager.generateAuthUrl(serverId, userId);

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[API] OAuth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth initialization failed',
      },
      { status: 500 }
    );
  }
}
