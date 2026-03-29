import { Request, Response } from 'express';
import { ReportService } from './report.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination';

const reportService = new ReportService();

export class ReportController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.create(req.user!.companyId, req.user!.userId, req.body);
    return createdResponse(res, report, 'Report created');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await reportService.list(
      req.user!.companyId, req.user!.userId, req.user!.role, pagination, req.query
    );
    return successResponse(res, paginatedResponse(data, total, pagination));
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.getById(req.params.id, req.user!.companyId);
    return successResponse(res, report);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.update(req.params.id, req.user!.companyId, req.body);
    return successResponse(res, report, 'Report updated');
  });

  static submit = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.submit(req.params.id, req.user!.companyId, req.user!.userId);
    return successResponse(res, report, 'Report submitted for approval');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await reportService.delete(req.params.id, req.user!.companyId);
    return successResponse(res, null, 'Report deleted');
  });
}
