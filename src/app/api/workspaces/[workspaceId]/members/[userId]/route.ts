import { NextRequest, NextResponse } from 'next/server';
import { memberManager } from '@/lib/team/member-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; userId: string } }
) {
  try {
    const result = await memberManager.getMemberByUser(
      params.workspaceId,
      params.userId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch member',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string; userId: string } }
) {
  try {
    const body = await request.json();
    const result = await memberManager.updateMember(
      params.workspaceId,
      params.userId,
      body
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to update member',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; userId: string } }
) {
  try {
    const result = await memberManager.removeMember(
      params.workspaceId,
      params.userId
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to remove member',
        },
      },
      { status: 500 }
    );
  }
}
