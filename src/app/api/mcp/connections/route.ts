/**
 * API Routes for MCP Connections
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCPOrchestrator } from '@/lib/mcp/orchestrator';
import { encrypt, decrypt } from '@/lib/auth/encryption';

const orchestrator = new MCPOrchestrator();

/**
 * GET /api/mcp/connections - Get all connections for user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    const userId = request.headers.get('x-user-id') || 'demo-user';

    const connectionManager = orchestrator.getConnectionManager();
    const connections = await connectionManager.getUserConnections(userId);

    // Remove sensitive credentials before sending
    const safeConnections = connections.map(conn => ({
      ...conn,
      credentials: {
        type: conn.credentials.type,
        // Don't send actual credentials
      },
    }));

    return NextResponse.json({
      success: true,
      connections: safeConnections,
    });
  } catch (error) {
    console.error('[API] Error getting connections:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcp/connections - Create new connection
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await request.json();

    const { serverId, credentials, metadata } = body;

    if (!serverId || !credentials) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: serverId, credentials',
        },
        { status: 400 }
      );
    }

    // Encrypt sensitive credentials
    if (credentials.accessToken) {
      credentials.accessToken = encrypt(credentials.accessToken);
    }
    if (credentials.apiKey) {
      credentials.apiKey = encrypt(credentials.apiKey);
    }
    if (credentials.password) {
      credentials.password = encrypt(credentials.password);
    }

    const connectionManager = orchestrator.getConnectionManager();
    const connection = await connectionManager.addConnection(
      userId,
      serverId,
      credentials,
      metadata
    );

    return NextResponse.json({
      success: true,
      connection: {
        ...connection,
        credentials: {
          type: connection.credentials.type,
        },
      },
    });
  } catch (error) {
    console.error('[API] Error creating connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mcp/connections/:id - Remove connection
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const url = new URL(request.url);
    const connectionId = url.searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing connection ID',
        },
        { status: 400 }
      );
    }

    const connectionManager = orchestrator.getConnectionManager();
    const removed = await connectionManager.removeConnection(userId, connectionId);

    if (!removed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connection not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[API] Error removing connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
