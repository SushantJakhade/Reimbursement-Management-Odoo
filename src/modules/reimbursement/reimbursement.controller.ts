import { Request, Response } from 'express';
import { ReimbursementService } from './reimbursement.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse } from '../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination';

const reimbursementService = new ReimbursementService();

export class ReimbursementController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await reimbursementService.list(
      req.user!.companyId, req.user!.userId, req.user!.role, pagination, req.query
    );
    return successResponse(res, paginatedResponse(data, total, pagination));
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const r = await reimbursementService.getById(req.params.id, req.user!.companyId);
    return successResponse(res, r);
  });

  static process = asyncHandler(async (req: Request, res: Response) => {
    const r = await reimbursementService.processPayment(req.params.id, req.user!.companyId, req.body);
    return successResponse(res, r, 'Payment processing initiated');
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const r = await reimbursementService.updateStatus(req.params.id, req.user!.companyId, req.body);
    return successResponse(res, r, 'Status updated');
  });
}
