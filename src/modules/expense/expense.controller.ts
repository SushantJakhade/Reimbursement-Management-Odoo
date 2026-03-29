import { Request, Response } from 'express';
import { ExpenseService } from './expense.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination';

const expenseService = new ExpenseService();

export class ExpenseController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const expense = await expenseService.create(req.user!.companyId, req.user!.userId, req.body);
    return createdResponse(res, expense, 'Expense created');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await expenseService.list(
      req.user!.companyId,
      req.user!.userId,
      req.user!.role,
      pagination,
      req.query
    );
    return successResponse(res, paginatedResponse(data, total, pagination));
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const expense = await expenseService.getById(req.params.id, req.user!.companyId);
    return successResponse(res, expense);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const expense = await expenseService.update(req.params.id, req.user!.companyId, req.user!.userId, req.body);
    return successResponse(res, expense, 'Expense updated');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await expenseService.delete(req.params.id, req.user!.companyId);
    return successResponse(res, null, 'Expense deleted');
  });

  static getDuplicates = asyncHandler(async (req: Request, res: Response) => {
    const duplicates = await expenseService.getDuplicates(req.params.id, req.user!.companyId);
    return successResponse(res, duplicates);
  });
}
