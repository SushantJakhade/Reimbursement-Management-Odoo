import { ReportRepository } from './report.repository';
import { NotFoundError, AppError } from '../../shared/middleware/error.middleware';
import { CreateReportDto, UpdateReportDto } from './report.dto';
import { PaginationParams } from '../../shared/utils/pagination';
import prisma from '../../config/database';

export class ReportService {
  private repo = new ReportRepository();

  async create(companyId: string, userId: string, dto: CreateReportDto) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { defaultCurrency: true },
    });

    return this.repo.create({
      ...dto,
      companyId,
      userId,
      companyCurrency: company?.defaultCurrency || 'USD',
    } as any);
  }

  async getById(id: string, companyId: string) {
    const report = await this.repo.findById(id, companyId);
    if (!report) throw new NotFoundError('Expense Report');
    return report;
  }

  async list(companyId: string, userId: string | null, role: string, pagination: PaginationParams, filters?: any) {
    const effectiveUserId = role === 'EMPLOYEE' ? userId : null;
    const prismaFilters: any = {};
    if (filters?.status) prismaFilters.status = filters.status;

    return this.repo.findMany(
      companyId,
      effectiveUserId,
      (pagination.page - 1) * pagination.limit,
      pagination.limit,
      prismaFilters
    );
  }

  async update(id: string, companyId: string, dto: UpdateReportDto) {
    const report = await this.getById(id, companyId);
    if (report.status !== 'DRAFT') throw new AppError('Only draft reports can be updated', 400);
    return this.repo.update(id, dto);
  }

  async submit(id: string, companyId: string, userId: string) {
    const report = await this.getById(id, companyId);
    if (report.status !== 'DRAFT') throw new AppError('Only draft reports can be submitted', 400);
    if (report.expenses.length === 0) throw new AppError('Cannot submit an empty report', 400);

    // Recalculate totals
    await this.repo.recalculateTotals(id);

    // Update all expenses to SUBMITTED
    await prisma.expense.updateMany({
      where: { reportId: id },
      data: { status: 'SUBMITTED' },
    });

    return this.repo.update(id, {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    });
  }

  async delete(id: string, companyId: string) {
    const report = await this.getById(id, companyId);
    if (report.status !== 'DRAFT') throw new AppError('Only draft reports can be deleted', 400);
    return this.repo.delete(id);
  }
}
