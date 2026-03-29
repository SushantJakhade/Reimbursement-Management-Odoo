import { BudgetRepository } from './budget.repository';
import { NotFoundError } from '../../shared/middleware/error.middleware';
import { CreateBudgetDto, UpdateBudgetDto } from './budget.dto';
import { PaginationParams } from '../../shared/utils/pagination';

export class BudgetService {
  private repo = new BudgetRepository();

  async create(companyId: string, dto: CreateBudgetDto) {
    return this.repo.create({ ...dto, companyId } as any);
  }

  async getById(id: string, companyId: string) {
    const budget = await this.repo.findById(id, companyId);
    if (!budget) throw new NotFoundError('Budget');
    return budget;
  }

  async list(companyId: string, pagination: PaginationParams) {
    return this.repo.findMany(companyId, (pagination.page - 1) * pagination.limit, pagination.limit);
  }

  async update(id: string, companyId: string, dto: UpdateBudgetDto) {
    await this.getById(id, companyId);
    return this.repo.update(id, dto);
  }

  async getUsage(budgetId: string, companyId: string, pagination: PaginationParams) {
    await this.getById(budgetId, companyId);
    return this.repo.getUsage(budgetId, (pagination.page - 1) * pagination.limit, pagination.limit);
  }

  async getAlerts(budgetId: string, companyId: string) {
    await this.getById(budgetId, companyId);
    return this.repo.getAlerts(budgetId);
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    return this.repo.acknowledgeAlert(alertId, userId);
  }
}
