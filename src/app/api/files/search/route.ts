/**
 * File Search API
 * Handles file search queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getFileSearchEngine } from '@/lib/files/search-engine';
import { SearchFilters } from '@/types/files';

/**
 * GET /api/files/search
 * Search files using semantic and full-text search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Parse filters
    const filters: SearchFilters = {};

    const fileType = searchParams.get('fileType');
    if (fileType) {
      filters.fileType = fileType.split(',');
    }

    const category = searchParams.get('category');
    if (category) {
      filters.category = category as any;
    }

    const dateRangeStart = searchParams.get('dateStart');
    const dateRangeEnd = searchParams.get('dateEnd');
    if (dateRangeStart && dateRangeEnd) {
      filters.dateRange = {
        start: new Date(dateRangeStart),
        end: new Date(dateRangeEnd),
      };
    }

    const minSize = searchParams.get('minSize');
    if (minSize) {
      filters.minSize = parseInt(minSize);
    }

    const maxSize = searchParams.get('maxSize');
    if (maxSize) {
      filters.maxSize = parseInt(maxSize);
    }

    const tags = searchParams.get('tags');
    if (tags) {
      filters.tags = tags.split(',');
    }

    // Perform search
    const searchEngine = getFileSearchEngine();
    const results = await searchEngine.searchFiles(
      query,
      session.user.id,
      filters
    );

    return NextResponse.json({
      query,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error('[Files Search API] Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files/search
 * Advanced search with complex filters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { query, filters } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Perform search
    const searchEngine = getFileSearchEngine();
    const results = await searchEngine.searchFiles(
      query,
      session.user.id,
      filters || {}
    );

    return NextResponse.json({
      query,
      filters,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error('[Files Search API] Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
