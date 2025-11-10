import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ErrorCode } from '@nexiums/shared';
import { AppError } from '../middleware/errorHandler';
import { generateShareCode } from '@nexiums/shared';
import bcrypt from 'bcryptjs';

export const createShareLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { artifactId, permissions, expiresAt, password, allowComments, allowDownload } = req.body;

    // Check ownership
    const artifact = await prisma.artifact.findUnique({
      where: { id: artifactId }
    });

    if (!artifact) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Artifact not found', 404);
    }

    if (artifact.userId !== req.user.id) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Not authorized', 403);
    }

    // Generate unique share code
    let shareCode: string;
    let exists = true;
    while (exists) {
      shareCode = generateShareCode();
      const existing = await prisma.shareLink.findUnique({
        where: { shareCode }
      });
      exists = !!existing;
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const shareLink = await prisma.shareLink.create({
      data: {
        artifactId,
        shareCode: shareCode!,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        password: hashedPassword,
        allowComments,
        allowDownload,
        createdBy: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...shareLink,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareCode}`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedArtifact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shareCode } = req.params;
    const { password } = req.body;

    const shareLink = await prisma.shareLink.findUnique({
      where: { shareCode },
      include: {
        artifact: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!shareLink) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Share link not found', 404);
    }

    // Check expiration
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Share link expired', 403);
    }

    // Check password
    if (shareLink.password) {
      if (!password) {
        return res.status(401).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Password required'
          }
        });
      }

      const isValid = await bcrypt.compare(password, shareLink.password);
      if (!isValid) {
        throw new AppError(ErrorCode.FORBIDDEN, 'Invalid password', 403);
      }
    }

    // Increment view count
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      success: true,
      data: {
        artifact: shareLink.artifact,
        permissions: shareLink.permissions,
        allowComments: shareLink.allowComments,
        allowDownload: shareLink.allowDownload
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShareLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, 'Not authenticated', 401);
    }

    const { id } = req.params;

    const shareLink = await prisma.shareLink.findUnique({
      where: { id }
    });

    if (!shareLink) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Share link not found', 404);
    }

    if (shareLink.createdBy !== req.user.id) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Not authorized', 403);
    }

    await prisma.shareLink.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: { message: 'Share link deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};
