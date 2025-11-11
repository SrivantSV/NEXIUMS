import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createArtifact, listArtifacts } from '@/lib/content/artifacts';
import type { ArtifactType, Language } from '@/types/content';

/**
 * GET /api/artifacts
 * List artifacts with filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ArtifactType | null;
    const search = searchParams.get('search');
    const isPublic = searchParams.get('isPublic');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await listArtifacts({
      userId: user.id,
      type: type || undefined,
      search: search || undefined,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: result.items,
        meta: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasMore: page * limit < result.total,
        },
      },
    });
  } catch (error: any) {
    console.error('Error listing artifacts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to list artifacts',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/artifacts
 * Create a new artifact
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.type || !body.language || !body.content) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: title, type, language, content',
          },
        },
        { status: 400 }
      );
    }

    // Validate content size (max 1MB)
    if (body.content.length > 1048576) {
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

    const artifact = await createArtifact({
      userId: user.id,
      title: body.title,
      description: body.description,
      type: body.type as ArtifactType,
      language: body.language as Language,
      content: body.content,
      dependencies: body.dependencies,
      metadata: body.metadata,
      tags: body.tags,
      isPublic: body.isPublic || false,
    });

    return NextResponse.json({
      success: true,
      data: artifact,
    });
  } catch (error: any) {
    console.error('Error creating artifact:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create artifact',
        },
      },
      { status: 500 }
    );
  }
}
