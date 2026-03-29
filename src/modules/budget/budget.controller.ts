import { Request, Response } from 'express';
import { BudgetService } from './budget.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination';

const budgetService = new BudgetService();

export class BudgetController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.create(req.user!.companyId, req.body);
    return createdResponse(res, budget, 'Budget created');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await budgetService.list(req.user!.companyId, pagination);
    return successResponse(res, paginatedResponse(data, total, pagination));
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.getById(req.params.id, req.user!.companyId);
    return successResponse(res, budget);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.update(req.params.id, req.user!.companyId, req.body);
    return successResponse(res, budget, 'Budget updated');
  });

  static getUsage = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await budgetService.getUsage(req.params.id, req.user!.companyId, pagination);
    return successResponse(res, paginatedResponse(data, total, pagination));
  });

  static getAlerts = asyncHandler(async (req: Request, res: Response) => {
    const alerts = await budgetService.getAlerts(req.params.id, req.user!.companyId);
    return successResponse(res, alerts);
  });

  static acknowledgeAlert = asyncHandler(async (req: Request, res: Response) => {
    const alert = await budgetService.acknowledgeAlert(req.params.alertId, req.user!.userId);
    return successResponse(res, alert, 'Alert acknowledged');
  });
}
