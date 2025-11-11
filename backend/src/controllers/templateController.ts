import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { cacheService } from '../utils/redis';
import { ErrorCode } from '@nexiums/shared';
import { AppError } from '../middleware/errorHandler';
import { parseQueryParams } from '@nexiums/shared';

export const getTemplates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, sortBy, sortOrder } = parseQueryParams(req.query);
    const { category, type, search } = req.query;

    const cacheKey = `templates:${JSON.stringify(req.query)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const where: any = {};

    if (category) where.category = category;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.artifactTemplate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { downloads: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),
      prisma.artifactTemplate.count({ where })
    ]);

    const response = {
      items: templates,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };

    await cacheService.set(cacheKey, response, 600); // Cache for 10 minutes

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const template = await prisma.artifactTemplate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    if (!template) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Template not found', 404);
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const template = await prisma.artifactTemplate.create({
      data: {
        ...req.body,
        createdBy: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    await cacheService.invalidatePattern('templates:*');

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
};

export const useTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id } = req.params;
    const { title, description } = req.body;

    const template = await prisma.artifactTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Template not found', 404);
    }

    // Create artifact from template
    const artifact = await prisma.artifact.create({
      data: {
        title: title || template.name,
        description: description || template.description,
        type: template.type,
        language: template.language,
        content: template.content,
        dependencies: template.dependencies,
        metadata: template.metadata,
        userId: req.user.id
      }
    });

    // Increment download count
    await prisma.artifactTemplate.update({
      where: { id },
      data: {
        downloads: { increment: 1 }
      }
    });

    res.status(201).json({
      success: true,
      data: artifact
    });
  } catch (error) {
    next(error);
  }
};
