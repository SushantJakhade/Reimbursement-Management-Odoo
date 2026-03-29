import { Request, Response } from 'express';
import { DepartmentService } from './department.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination';

const departmentService = new DepartmentService();

export class DepartmentController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const dept = await departmentService.create(req.user!.companyId, req.body);
    return createdResponse(res, dept, 'Department created');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await departmentService.list(req.user!.companyId, pagination);
    return successResponse(res, paginatedResponse(data, total, pagination));
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const dept = await departmentService.getById(req.params.id, req.user!.companyId);
    return successResponse(res, dept);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const dept = await departmentService.update(req.params.id, req.user!.companyId, req.body);
    return successResponse(res, dept, 'Department updated');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await departmentService.delete(req.params.id, req.user!.companyId);
    return successResponse(res, null, 'Department deactivated');
  });

  static getExpenses = asyncHandler(async (req: Request, res: Response) => {
    const expenses = await departmentService.getExpenses(req.params.id, req.user!.companyId);
    return successResponse(res, expenses);
  });
}
