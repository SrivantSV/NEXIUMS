import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getArtifact, executeArtifact } from '@/lib/content/artifacts';
import type { ExecutionInput } from '@/types/content';

/**
 * POST /api/artifacts/[id]/execute
 * Execute an artifact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Check if artifact exists and is accessible
    const artifact = await getArtifact(params.id);
    if (!artifact) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Artifact not found',
          },
        },
        { status: 404 }
      );
    }

    if (artifact.userId !== user.id && !artifact.isPublic) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const input: ExecutionInput | undefined = body.input;

    const execution = await executeArtifact(params.id, user.id, input);

    return NextResponse.json({
      success: true,
      data: execution,
    });
  } catch (error: any) {
    console.error('Error executing artifact:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to execute artifact',
        },
      },
      { status: 500 }
    );
  }
}
