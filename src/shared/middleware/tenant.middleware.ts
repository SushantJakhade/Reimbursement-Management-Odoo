import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

/**
 * Tenant isolation middleware
 * Ensures all queries are scoped to the authenticated user's company.
 * Attaches companyId to req body and query for downstream use.
 */
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return errorResponse(res, 'Authentication required for tenant isolation', 401);
  }

  // Inject companyId into request body (for creates/updates)
  if (req.body && typeof req.body === 'object') {
    req.body.companyId = req.user.companyId;
  }

  // Make companyId available on query (for reads)
  (req as any).companyId = req.user.companyId;

  next();
}
