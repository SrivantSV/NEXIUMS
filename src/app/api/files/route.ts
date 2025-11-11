/**
 * Files API Routes
 * Handles file CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { FileProcessingResult } from '@/types/files';

/**
 * GET /api/files
 * Get all files for the current user
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
    const category = searchParams.get('category');
    const fileType = searchParams.get('fileType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    const where: any = {
      userId: session.user.id,
    };

    if (category) {
      where.category = category;
    }

    if (fileType) {
      where.fileType = fileType;
    }

    // Fetch files
    const files = await prisma.file.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.file.count({ where });

    return NextResponse.json({
      files,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Files API] GET failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 * Create a new file record
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
    const fileResult: FileProcessingResult = body;

    // Validate
    if (!fileResult.id || !fileResult.originalFile) {
      return NextResponse.json(
        { error: 'Invalid file data' },
        { status: 400 }
      );
    }

    // Create file record
    const file = await prisma.file.create({
      data: {
        id: fileResult.id,
        userId: session.user.id,
        fileName: fileResult.originalFile.name,
        fileType: fileResult.originalFile.type,
        fileSize: fileResult.originalFile.size,
        category: fileResult.originalFile.category || 'other',
        extension: fileResult.originalFile.extension,
        storageUrl: fileResult.originalFile.storageUrl,
        thumbnailUrl: fileResult.originalFile.thumbnailUrl,

        // Processing results
        textContent: fileResult.processedData.textContent,
        metadata: fileResult.originalFile as any,
        analysis: fileResult.analysis as any,

        // Status
        status: fileResult.status,
        processingTime: fileResult.processingTime,
        error: fileResult.error,

        // Security
        securityScan: fileResult.securityScan as any,
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error('[Files API] POST failed:', error);
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files
 * Delete multiple files
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',') || [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No file IDs provided' },
        { status: 400 }
      );
    }

    // Delete files (only if owned by user)
    const result = await prisma.file.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      deleted: result.count,
    });
  } catch (error) {
    console.error('[Files API] DELETE failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}
