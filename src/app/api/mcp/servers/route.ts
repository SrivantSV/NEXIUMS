/**
 * API Route for getting available MCP servers
 */

import { NextResponse } from 'next/server';
import { getMCPServerConfigs, getAllCategories } from '@/lib/mcp/server-registry';

/**
 * GET /api/mcp/servers - Get all available MCP servers
 */
export async function GET() {
  try {
    const servers = getMCPServerConfigs();
    const categories = getAllCategories();

    return NextResponse.json({
      success: true,
      servers,
      categories,
    });
  } catch (error) {
    console.error('[API] Error getting servers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
