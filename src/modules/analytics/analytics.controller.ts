import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse } from '../../shared/utils/response';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  static getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.getDashboardMetrics(
      req.user!.companyId,
      req.user!.userId,
      req.user!.role
    );
    return successResponse(res, data, 'Dashboard analytics retrieved successfully');
  });
}
