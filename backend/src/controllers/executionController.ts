import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ErrorCode } from '@nexiums/shared';
import { AppError } from '../middleware/errorHandler';
import { parseQueryParams } from '@nexiums/shared';

export const getExecutions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { page, limit, sortBy, sortOrder } = parseQueryParams(req.query);
    const { artifactId, status } = req.query;

    const where: any = {
      userId: req.user.id
    };

    if (artifactId) where.artifactId = artifactId;
    if (status) where.status = status;

    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { startedAt: 'desc' },
        include: {
          artifact: {
            select: {
              id: true,
              title: true,
              type: true,
              language: true
            }
          }
        }
      }),
      prisma.execution.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        items: executions,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getExecution = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id } = req.params;

    const execution = await prisma.execution.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        artifact: {
          select: {
            id: true,
            title: true,
            type: true,
            language: true,
            content: true
          }
        }
      }
    });

    if (!execution) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Execution not found', 404);
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    next(error);
  }
};

export const cancelExecution = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id } = req.params;

    const execution = await prisma.execution.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!execution) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Execution not found', 404);
    }

    if (!['PENDING', 'QUEUED', 'RUNNING'].includes(execution.status)) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        'Execution cannot be cancelled',
        400
      );
    }

    const updated = await prisma.execution.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
