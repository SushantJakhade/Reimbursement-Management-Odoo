import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse } from '../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination';

const notificationService = new NotificationService();

export class NotificationController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await notificationService.list(
      req.user!.userId, req.user!.companyId, pagination
    );
    return successResponse(res, paginatedResponse(data, total, pagination));
  });

  static markRead = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAsRead(req.params.id, req.user!.userId);
    return successResponse(res, null, 'Notification marked as read');
  });

  static markAllRead = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllAsRead(req.user!.userId, req.user!.companyId);
    return successResponse(res, null, 'All notifications marked as read');
  });

  static unreadCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.userId, req.user!.companyId);
    return successResponse(res, count);
  });
}
