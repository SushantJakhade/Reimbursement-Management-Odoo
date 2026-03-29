import { Request, Response } from 'express';
import { RuleService } from './rule.service';
import { asyncHandler } from '../../../shared/middleware/error.middleware';
import { successResponse, createdResponse } from '../../../shared/utils/response';

const ruleService = new RuleService();

export class RuleController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const rule = await ruleService.create(req.user!.companyId, req.body);
    return createdResponse(res, rule, 'Approval rule created');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const rules = await ruleService.list(req.user!.companyId);
    return successResponse(res, rules);
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const rule = await ruleService.getById(req.params.id, req.user!.companyId);
    return successResponse(res, rule);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const rule = await ruleService.update(req.params.id, req.user!.companyId, req.body);
    return successResponse(res, rule, 'Rule updated');
  });

  static addStep = asyncHandler(async (req: Request, res: Response) => {
    const step = await ruleService.addStep(req.params.id, req.user!.companyId, req.body);
    return createdResponse(res, step, 'Step added');
  });

  static updateStep = asyncHandler(async (req: Request, res: Response) => {
    const step = await ruleService.updateStep(req.params.id, req.params.stepId, req.user!.companyId, req.body);
    return successResponse(res, step, 'Step updated');
  });

  static deleteStep = asyncHandler(async (req: Request, res: Response) => {
    await ruleService.deleteStep(req.params.id, req.params.stepId, req.user!.companyId);
    return successResponse(res, null, 'Step removed');
  });
}
