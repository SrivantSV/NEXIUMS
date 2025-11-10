import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ErrorCode } from '@nexiums/shared';
import { AppError } from '../middleware/errorHandler';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        bio: true,
        website: true,
        location: true,
        github: true,
        twitter: true,
        createdAt: true,
        _count: {
          select: {
            artifacts: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);
    }

    res.json({
      success: true,
      data: {
        ...user,
        artifactCount: user._count.artifacts
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const updates = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        bio: true,
        website: true,
        location: true,
        github: true,
        twitter: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const getUserArtifacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const artifacts = await prisma.artifact.findMany({
      where: {
        userId,
        isPublic: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
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

    res.json({
      success: true,
      data: artifacts
    });
  } catch (error) {
    next(error);
  }
};
