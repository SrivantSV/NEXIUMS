import { NextRequest, NextResponse } from 'next/server';
import { rbacManager } from '@/lib/team/rbac-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const result = await rbacManager.getWorkspaceRoles(params.workspaceId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch roles',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const body = await request.json();
    const { name, description, level, permissions } = body;

    if (!name || level === undefined || !permissions) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'name, level, and permissions are required',
          },
        },
        { status: 400 }
      );
    }

    const result = await rbacManager.createRole(params.workspaceId, {
      name,
      description,
      level,
      permissions,
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
          message: 'Failed to create role',
        },
      },
      { status: 500 }
    );
  }
}
