import { NextRequest, NextResponse } from 'next/server';
import { workspaceManager } from '@/lib/team/workspace-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const result = await workspaceManager.getWorkspace(params.workspaceId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch workspace',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const body = await request.json();
    const result = await workspaceManager.updateWorkspace(
      params.workspaceId,
      body
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update workspace',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const result = await workspaceManager.deleteWorkspace(params.workspaceId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to delete workspace',
        },
      },
      { status: 500 }
    );
  }
}
