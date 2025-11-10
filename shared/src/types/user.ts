import { z } from 'zod';

// ============================================================================
// USER TYPES
// ============================================================================

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  bio?: string;
  website?: string;
  location?: string;
  github?: string;
  twitter?: string;
  artifactCount: number;
  followerCount: number;
  followingCount: number;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
  location: z.string().max(100).optional(),
  github: z.string().max(100).optional(),
  twitter: z.string().max(100).optional()
});
