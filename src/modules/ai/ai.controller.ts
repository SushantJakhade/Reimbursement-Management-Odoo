import { Request, Response } from 'express';
import { AiService } from './ai.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse } from '../../shared/utils/response';

const aiService = new AiService();

export class AiController {
  static categorize = asyncHandler(async (req: Request, res: Response) => {
    const result = await aiService.categorize(req.user!.companyId, req.body.description, req.body.merchant);
    return successResponse(res, result);
  });

  static detectDuplicates = asyncHandler(async (req: Request, res: Response) => {
    const result = await aiService.detectDuplicates(req.user!.companyId, req.body.expenseId);
    return successResponse(res, result);
  });

  static getSuggestions = asyncHandler(async (req: Request, res: Response) => {
    const result = await aiService.getSuggestions(req.user!.companyId, req.params.expenseId);
    return successResponse(res, result);
  });
}
