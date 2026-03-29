import { Request, Response } from 'express';
import { WorkflowService } from './workflow.service';
import { asyncHandler } from '../../../shared/middleware/error.middleware';
import { successResponse } from '../../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../../shared/utils/pagination';

const workflowService = new WorkflowService();

export class WorkflowController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    const { data, total } = await workflowService.list(req.user!.companyId, pagination, filters);
    return successResponse(res, paginatedResponse(data, total, pagination));
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const workflow = await workflowService.getById(req.params.id);
    return successResponse(res, workflow);
  });

  static pending = asyncHandler(async (req: Request, res: Response) => {
    const workflows = await workflowService.getPendingForUser(req.user!.userId, req.user!.companyId);
    return successResponse(res, workflows);
  });
}
