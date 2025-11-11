import { NextRequest, NextResponse } from 'next/server';
import { memberManager } from '@/lib/team/member-manager';
import { rbacManager } from '@/lib/team/rbac-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const result = await memberManager.getWorkspaceInvitations(
      params.workspaceId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch invitations',
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
    const { email, roleId, invitedBy, message } = body;

    if (!email || !roleId || !invitedBy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'email, roleId, and invitedBy are required',
          },
        },
        { status: 400 }
      );
    }

    // Get role
    const roleResult = await rbacManager.getRole(roleId);
    if (!roleResult.success || !roleResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
          },
        },
        { status: 404 }
      );
    }

    const result = await memberManager.createInvitation({
      workspaceId: params.workspaceId,
      email,
      role: roleResult.data,
      invitedBy,
      message,
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
          message: 'Failed to create invitation',
        },
      },
      { status: 500 }
    );
  }
}
