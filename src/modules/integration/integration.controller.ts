import { Request, Response } from 'express';
import { IntegrationService } from './integration.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse, createdResponse } from '../../shared/utils/response';

const integrationService = new IntegrationService();

export class IntegrationController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const integration = await integrationService.create(req.user!.companyId, req.body);
    return createdResponse(res, integration, 'Integration created');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const integrations = await integrationService.list(req.user!.companyId);
    return successResponse(res, integrations);
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const integration = await integrationService.getById(req.params.id, req.user!.companyId);
    return successResponse(res, integration);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const integration = await integrationService.update(req.params.id, req.user!.companyId, req.body);
    return successResponse(res, integration, 'Integration updated');
  });

  static test = asyncHandler(async (req: Request, res: Response) => {
    const result = await integrationService.testConnection(req.params.id, req.user!.companyId);
    return successResponse(res, result);
  });
}
