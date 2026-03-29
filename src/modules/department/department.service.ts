import { DepartmentRepository } from './department.repository';
import { NotFoundError } from '../../shared/middleware/error.middleware';
import { CreateDepartmentDto, UpdateDepartmentDto } from './department.dto';
import { PaginationParams } from '../../shared/utils/pagination';

export class DepartmentService {
  private repo = new DepartmentRepository();

  async create(companyId: string, dto: CreateDepartmentDto) {
    return this.repo.create({ ...dto, companyId } as any);
  }

  async getById(id: string, companyId: string) {
    const dept = await this.repo.findById(id, companyId);
    if (!dept) throw new NotFoundError('Department');
    return dept;
  }

  async list(companyId: string, pagination: PaginationParams) {
    return this.repo.findMany(companyId, (pagination.page - 1) * pagination.limit, pagination.limit);
  }

  async update(id: string, companyId: string, dto: UpdateDepartmentDto) {
    await this.getById(id, companyId);
    return this.repo.update(id, dto);
  }

  async delete(id: string, companyId: string) {
    await this.getById(id, companyId);
    return this.repo.delete(id);
  }

  async getExpenses(departmentId: string, companyId: string) {
    return this.repo.getDepartmentExpenses(departmentId, companyId);
  }
}
