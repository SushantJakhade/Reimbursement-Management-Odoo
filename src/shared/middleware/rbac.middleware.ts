import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

/**
 * Role-Based Access Control middleware factory
 * Restricts access to specified roles
 *
 * @example
 * router.get('/admin-only', authMiddleware, rbacMiddleware('ADMIN'), handler);
 * router.get('/managers', authMiddleware, rbacMiddleware('ADMIN', 'MANAGER'), handler);
 */
export function rbacMiddleware(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
}

/**
 * Check if user is an admin
 */
export const isAdmin = rbacMiddleware('ADMIN');

/**
 * Check if user is admin or manager
 */
export const isAdminOrManager = rbacMiddleware('ADMIN', 'MANAGER');

/**
 * Check if the user owns the resource or is an admin
 */
export function ownerOrAdmin(userIdExtractor: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const resourceUserId = userIdExtractor(req);

    if (req.user.role === 'ADMIN' || req.user.userId === resourceUserId) {
      return next();
    }

    return errorResponse(res, 'Access denied', 403);
  };
}
