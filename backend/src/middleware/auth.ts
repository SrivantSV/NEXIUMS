import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { ErrorCode } from '@nexiums/shared';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'No token provided'
        }
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        userId: string;
        email: string;
        role: string;
      };

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not found'
          }
        });
      }

      req.user = user;
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: {
            code: ErrorCode.TOKEN_EXPIRED,
            message: 'Token expired'
          }
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Invalid token'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Not authenticated'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: ErrorCode.FORBIDDEN,
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};
