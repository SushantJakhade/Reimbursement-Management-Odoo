import { Request, Response } from 'express';
import { UserService } from './user.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { parsePagination, paginatedResponse } from '../../shared/utils/pagination';

const userService = new UserService();

export class UserController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.user!.companyId, req.body);
    return createdResponse(res, user, 'User created successfully');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const filters: any = {};
    if (req.query.role) filters.role = req.query.role;
    if (req.query.departmentId) filters.departmentId = req.query.departmentId;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const { data, total } = await userService.listUsers(req.user!.companyId, pagination, filters);
    return successResponse(res, paginatedResponse(data, total, pagination));
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUser(req.params.id, req.user!.companyId);
    return successResponse(res, user);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id, req.user!.companyId, req.body);
    return successResponse(res, user, 'User updated');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await userService.deactivateUser(req.params.id, req.user!.companyId);
    return successResponse(res, null, 'User deactivated');
  });

  static getPoints = asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const { data, total } = await userService.getUserPoints(
      req.params.id,
      req.user!.companyId,
      pagination
    );
    return successResponse(res, paginatedResponse(data, total, pagination));
  });
}
