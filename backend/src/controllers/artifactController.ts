import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { cacheService } from '../utils/redis';
import { ErrorCode } from '@nexiums/shared';
import { AppError } from '../middleware/errorHandler';
import { executionService } from '../services/executionService';
import { parseQueryParams } from '@nexiums/shared';

export const createArtifact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const artifact = await prisma.artifact.create({
      data: {
        ...req.body,
        userId: req.user.id,
        version: 1
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Create initial version
    await prisma.artifactVersion.create({
      data: {
        artifactId: artifact.id,
        version: 1,
        content: artifact.content,
        message: 'Initial version',
        createdBy: req.user.id
      }
    });

    // Invalidate cache
    await cacheService.invalidatePattern(`artifacts:user:${req.user.id}:*`);

    res.status(201).json({
      success: true,
      data: artifact
    });
  } catch (error) {
    next(error);
  }
};

export const getArtifacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { page, limit, sortBy, sortOrder } = parseQueryParams(req.query);
    const { type, language, search, isPublic } = req.query;

    // Build where clause
    const where: any = {
      userId: req.user.id
    };

    if (type) where.type = type;
    if (language) where.language = language;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Check cache
    const cacheKey = `artifacts:user:${req.user.id}:${JSON.stringify(req.query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const [artifacts, total] = await Promise.all([
      prisma.artifact.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          _count: {
            select: {
              executions: true,
              versions: true
            }
          }
        }
      }),
      prisma.artifact.count({ where })
    ]);

    const response = {
      items: artifacts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, response, 300);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
};

export const getArtifact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id } = req.params;

    const artifact = await prisma.artifact.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        _count: {
          select: {
            executions: true,
            versions: true
          }
        }
      }
    });

    if (!artifact) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Artifact not found', 404);
    }

    res.json({
      success: true,
      data: artifact
    });
  } catch (error) {
    next(error);
  }
};

export const updateArtifact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const existing = await prisma.artifact.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Artifact not found', 404);
    }

    if (existing.userId !== req.user.id) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Not authorized', 403);
    }

    // If content changed, create new version
    let newVersion = existing.version;
    if (updates.content && updates.content !== existing.content) {
      newVersion = existing.version + 1;

      await prisma.artifactVersion.create({
        data: {
          artifactId: id,
          version: newVersion,
          content: updates.content,
          message: updates.versionMessage || 'Update',
          createdBy: req.user.id
        }
      });
    }

    const artifact = await prisma.artifact.update({
      where: { id },
      data: {
        ...updates,
        version: newVersion
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Invalidate cache
    await cacheService.invalidatePattern(`artifacts:user:${req.user.id}:*`);
    await cacheService.del(`artifact:${id}`);

    res.json({
      success: true,
      data: artifact
    });
  } catch (error) {
    next(error);
  }
};

export const deleteArtifact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id } = req.params;

    // Check ownership
    const artifact = await prisma.artifact.findUnique({
      where: { id }
    });

    if (!artifact) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Artifact not found', 404);
    }

    if (artifact.userId !== req.user.id) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Not authorized', 403);
    }

    await prisma.artifact.delete({
      where: { id }
    });

    // Invalidate cache
    await cacheService.invalidatePattern(`artifacts:user:${req.user.id}:*`);
    await cacheService.del(`artifact:${id}`);

    res.json({
      success: true,
      data: { message: 'Artifact deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

export const executeArtifact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id } = req.params;
    const { input } = req.body;

    // Get artifact
    const artifact = await prisma.artifact.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      }
    });

    if (!artifact) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Artifact not found', 404);
    }

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        artifactId: id,
        userId: req.user.id,
        status: 'QUEUED',
        input: input || {}
      }
    });

    // Queue execution
    executionService.queueExecution(execution.id, artifact, input);

    res.status(202).json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

export const getArtifactVersions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id } = req.params;

    // Check access
    const artifact = await prisma.artifact.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      }
    });

    if (!artifact) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Artifact not found', 404);
    }

    const versions = await prisma.artifactVersion.findMany({
      where: { artifactId: id },
      orderBy: { version: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

export const revertArtifactVersion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id, versionId } = req.params;

    // Check ownership
    const artifact = await prisma.artifact.findUnique({
      where: { id }
    });

    if (!artifact) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Artifact not found', 404);
    }

    if (artifact.userId !== req.user.id) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Not authorized', 403);
    }

    // Get version
    const version = await prisma.artifactVersion.findUnique({
      where: { id: versionId }
    });

    if (!version || version.artifactId !== id) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Version not found', 404);
    }

    // Create new version with reverted content
    const newVersion = artifact.version + 1;

    await prisma.artifactVersion.create({
      data: {
        artifactId: id,
        version: newVersion,
        content: version.content,
        message: `Reverted to version ${version.version}`,
        createdBy: req.user.id
      }
    });

    // Update artifact
    const updated = await prisma.artifact.update({
      where: { id },
      data: {
        content: version.content,
        version: newVersion
      }
    });

    // Invalidate cache
    await cacheService.invalidatePattern(`artifacts:user:${req.user.id}:*`);
    await cacheService.del(`artifact:${id}`);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
