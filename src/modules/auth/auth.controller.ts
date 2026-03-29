import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse, createdResponse } from '../../shared/utils/response';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return createdResponse(res, result, 'Company registered successfully');
  });

  /**
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return successResponse(res, result, 'Login successful');
  });

  /**
   * POST /api/v1/auth/refresh
   */
  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    return successResponse(res, tokens, 'Token refreshed');
  });

  /**
   * POST /api/v1/auth/logout
   */
  static logout = asyncHandler(async (_req: Request, res: Response) => {
    // In a production system, you'd blacklist the token
    return successResponse(res, null, 'Logged out successfully');
  });

  /**
   * GET /api/v1/auth/me
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await authService.getProfile(req.user!.userId);
    return successResponse(res, profile);
  });
}
