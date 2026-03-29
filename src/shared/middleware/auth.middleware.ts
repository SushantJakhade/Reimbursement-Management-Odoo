import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { errorResponse } from '../utils/response';
import prisma from '../../config/database';

export interface AuthUser {
  userId: string;
  companyId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * JWT authentication middleware
 * Extracts and verifies the Bearer token, attaches user info to req.user
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    const payload = jwt.verify(token, env.jwtSecret) as AuthUser;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, companyId: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'User account not found or deactivated', 401);
    }

    req.user = {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return errorResponse(res, 'Token expired', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return errorResponse(res, 'Invalid token', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
}
