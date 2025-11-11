import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getArtifact,
  updateArtifact,
  deleteArtifact,
} from '@/lib/content/artifacts';

/**
 * GET /api/artifacts/[id]
 * Get artifact by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

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

    // Check permissions
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

    return NextResponse.json({
      success: true,
      data: artifact,
    });
  } catch (error: any) {
    console.error('Error getting artifact:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to get artifact',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/artifacts/[id]
 * Update artifact
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    // Check ownership
    const existing = await getArtifact(params.id);
    if (!existing) {
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

    if (existing.userId !== user.id) {
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

    // Validate content size if provided
    if (body.content && body.content.length > 1048576) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Content size exceeds maximum of 1MB',
          },
        },
        { status: 400 }
      );
    }

    const artifact = await updateArtifact(params.id, body);

    return NextResponse.json({
      success: true,
      data: artifact,
    });
  } catch (error: any) {
    console.error('Error updating artifact:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update artifact',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/artifacts/[id]
 * Delete artifact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    // Check ownership
    const existing = await getArtifact(params.id);
    if (!existing) {
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

    if (existing.userId !== user.id) {
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

    await deleteArtifact(params.id);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Artifact deleted successfully',
      },
    });
  } catch (error: any) {
    console.error('Error deleting artifact:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete artifact',
        },
      },
      { status: 500 }
    );
  }
}
