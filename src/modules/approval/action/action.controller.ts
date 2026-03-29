import { Request, Response } from 'express';
import { ActionService } from './action.service';
import { asyncHandler } from '../../../shared/middleware/error.middleware';
import { successResponse } from '../../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../../shared/utils/pagination';

const actionService = new ActionService();

export class ActionController {
  static takeAction = asyncHandler(async (req: Request, res: Response) => {
    const action = await actionService.takeAction(req.user!.companyId, req.user!.userId, req.body);
    return successResponse(res, action, 'Action recorded successfully');
  });

  static history = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await actionService.getHistory(
      req.user!.companyId, req.user!.userId, pagination
    );
    return successResponse(res, paginatedResponse(data, total, pagination));
  });
}
