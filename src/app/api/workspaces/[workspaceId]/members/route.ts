import { NextRequest, NextResponse } from 'next/server';
import { memberManager } from '@/lib/team/member-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const result = await memberManager.getWorkspaceMembers(params.workspaceId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch members',
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
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId and role are required',
          },
        },
        { status: 400 }
      );
    }

    const result = await memberManager.addMember({
      userId,
      workspaceId: params.workspaceId,
      role,
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
          message: 'Failed to add member',
        },
      },
      { status: 500 }
    );
  }
}
