import { UserRepository } from './user.repository';
import { hashPassword } from '../../shared/utils/crypto';
import { NotFoundError, ConflictError } from '../../shared/middleware/error.middleware';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { PaginationParams } from '../../shared/utils/pagination';

export class UserService {
  private repo = new UserRepository();

  async createUser(companyId: string, dto: CreateUserDto) {
    const existing = await this.repo.checkEmailExists(companyId, dto.email);
    if (existing) throw new ConflictError('Email already registered in this company');

    const passwordHash = await hashPassword(dto.password);
    const { password, ...rest } = dto;

    return this.repo.create({
      ...rest,
      passwordHash,
      company: { connect: { id: companyId } },
      ...(dto.departmentId && { department: { connect: { id: dto.departmentId } } }),
      ...(dto.managerId && { manager: { connect: { id: dto.managerId } } }),
    } as any);
  }

  async getUser(id: string, companyId: string) {
    const user = await this.repo.findById(id, companyId);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async listUsers(companyId: string, pagination: PaginationParams, filters?: any) {
    const { page, limit, sortBy, sortOrder } = pagination;
    return this.repo.findMany(
      companyId,
      (page - 1) * limit,
      limit,
      { [sortBy || 'createdAt']: sortOrder || 'desc' },
      filters
    );
  }

  async updateUser(id: string, companyId: string, dto: UpdateUserDto) {
    await this.getUser(id, companyId); // verify exists
    return this.repo.update(id, companyId, dto);
  }

  async deactivateUser(id: string, companyId: string) {
    await this.getUser(id, companyId);
    return this.repo.deactivate(id, companyId);
  }

  async getUserPoints(userId: string, companyId: string, pagination: PaginationParams) {
    return this.repo.getPointsLedger(
      userId,
      companyId,
      (pagination.page - 1) * pagination.limit,
      pagination.limit
    );
  }
}
