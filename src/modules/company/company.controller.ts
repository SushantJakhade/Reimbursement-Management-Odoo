import { Request, Response } from 'express';
import { CompanyService } from './company.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse } from '../../shared/utils/response';

const companyService = new CompanyService();

export class CompanyController {
  static get = asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.getCompany(req.user!.companyId);
    return successResponse(res, company);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.updateCompany(req.user!.companyId, req.body);
    return successResponse(res, company, 'Company updated');
  });

  static stats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await companyService.getStats(req.user!.companyId);
    return successResponse(res, stats);
  });
}
