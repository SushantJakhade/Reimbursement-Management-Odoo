import { Request, Response } from 'express';
import { RecognitionService } from './recognition.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse } from '../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination';

const recognitionService = new RecognitionService();

export class RecognitionController {
  static getPoints = asyncHandler(async (req: Request, res: Response) => {
    const points = await recognitionService.getPoints(req.user!.userId);
    return successResponse(res, points);
  });

  static leaderboard = asyncHandler(async (req: Request, res: Response) => {
    const board = await recognitionService.getLeaderboard(req.user!.companyId);
    return successResponse(res, board);
  });

  static history = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await recognitionService.getHistory(
      req.user!.userId, req.user!.companyId, pagination
    );
    return successResponse(res, paginatedResponse(data, total, pagination));
  });
}
