/**
 * API Route for executing MCP operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { MCPOrchestrator } from '@/lib/mcp/orchestrator';

const orchestrator = new MCPOrchestrator();

/**
 * POST /api/mcp/execute - Execute MCP operation
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await request.json();

    const { userRequest, conversationContext } = body;

    if (!userRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: userRequest',
        },
        { status: 400 }
      );
    }

    // Build context
    const context = conversationContext || {
      userId,
      conversationId: 'default',
      history: [],
    };

    // Process request
    const result = await orchestrator.processUserRequest(
      userRequest,
      userId,
      context
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error executing MCP operation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
