import { NextRequest, NextResponse } from 'next/server';
import { workspaceManager } from '@/lib/team/workspace-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, ownerId, plan } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name and ownerId are required',
          },
        },
        { status: 400 }
      );
    }

    const result = await workspaceManager.createWorkspace({
      name,
      description,
      ownerId,
      plan,
    });

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create workspace',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId is required',
          },
        },
        { status: 400 }
      );
    }

    const result = await workspaceManager.getUserWorkspaces(userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch workspaces',
        },
      },
      { status: 500 }
    );
  }
}
