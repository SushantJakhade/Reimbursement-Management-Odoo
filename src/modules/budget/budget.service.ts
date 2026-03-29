import { BudgetRepository } from './budget.repository';
import { NotFoundError } from '../../shared/middleware/error.middleware';
import { CreateBudgetDto, UpdateBudgetDto } from './budget.dto';
import { PaginationParams } from '../../shared/utils/pagination';
import prisma from '../../config/database';

export class BudgetService {
  private repo = new BudgetRepository();

  async create(companyId: string, dto: CreateBudgetDto) {
    const now = new Date();
    let startDate = dto.startDate ? new Date(dto.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    let endDate = dto.endDate ? new Date(dto.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (!dto.startDate || !dto.endDate) {
      if (dto.period === 'YEARLY') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      } else if (dto.period === 'QUARTERLY') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      } else if (dto.period === 'WEEKLY') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Initial spent calculation from existing approved expenses
    const spentAggregate = await prisma.expense.aggregate({
      where: {
        companyId,
        status: 'APPROVED',
        expenseDate: { gte: startDate, lte: endDate },
        ...(dto.userId && { userId: dto.userId }),
        ...(dto.departmentId && { departmentId: dto.departmentId }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
      },
      _sum: { convertedAmount: true }
    });

    return this.repo.create({
      ...dto,
      companyId,
      startDate,
      endDate,
      spent: spentAggregate._sum.convertedAmount || 0,
    } as any);
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
