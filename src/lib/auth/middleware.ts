/**
 * Authentication Middleware
 * JWT-based authentication and API key validation
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE';
}

/**
 * Authenticate request using JWT or API key
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthUser> {
  // Check for Authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new Error('No authorization header');
  }

  // Bearer token (JWT)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // API Key
  if (authHeader.startsWith('ApiKey ')) {
    const apiKey = authHeader.slice(7);
    // In production, validate API key against database
    // For now, return mock user
    return {
      id: 'api-user',
      email: 'api@example.com',
      subscriptionTier: 'PRO',
    };
  }

  throw new Error('Invalid authorization format');
}

/**
 * Check usage limits based on subscription tier
 */
export async function checkUsageLimit(userId: string): Promise<void> {
  // In production, check against database
  // For now, allow all requests
  return;
}

/**
 * Generate JWT token
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}
