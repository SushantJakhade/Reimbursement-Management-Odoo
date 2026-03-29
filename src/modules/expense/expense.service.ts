import { ExpenseRepository } from './expense.repository';
import { NotFoundError, AppError } from '../../shared/middleware/error.middleware';
import { convertCurrency } from '../../shared/utils/currency';
import { CreateExpenseDto, UpdateExpenseDto } from './expense.dto';
import { PaginationParams } from '../../shared/utils/pagination';
import prisma from '../../config/database';

export class ExpenseService {
  private repo = new ExpenseRepository();

  /**
   * Create an expense with automatic currency conversion
   */
  async create(companyId: string, userId: string, dto: CreateExpenseDto) {
    // Get company's default currency
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { defaultCurrency: true },
    });

    if (!company) throw new AppError('Company not found', 404);

    // Convert to company currency
    const { convertedAmount, exchangeRate } = await convertCurrency(
      dto.amount,
      dto.currency,
      company.defaultCurrency
    );

    // Check for duplicates
    const duplicates = await this.repo.findPotentialDuplicates(
      companyId,
      dto.merchant,
      dto.amount,
      dto.expenseDate as unknown as Date
    );

    const expense = await this.repo.create({
      ...dto,
      expenseDate: new Date(dto.expenseDate as unknown as string),
      companyId,
      userId,
      convertedAmount,
      companyCurrency: company.defaultCurrency,
      exchangeRate,
      isDuplicate: duplicates.length > 0,
    } as any);

    // If duplicates found, record them
    if (duplicates.length > 0) {
      await prisma.duplicateDetection.createMany({
        data: duplicates.map((dup) => ({
          expenseId: expense.id,
          duplicateExpenseId: dup.id,
          confidence: 0.8,
          matchFields: ['merchant', 'amount', 'date'],
        })),
      });
    }

    return expense;
  }

  async getById(id: string, companyId: string) {
    const expense = await this.repo.findById(id, companyId);
    if (!expense) throw new NotFoundError('Expense');
    return expense;
  }

  async list(companyId: string, userId: string | null, role: string, pagination: PaginationParams, filters?: any) {
    // Employees see only their own; managers/admins see all
    const effectiveUserId = role === 'EMPLOYEE' ? userId : null;

    const prismaFilters: any = {};
    if (filters?.status) prismaFilters.status = filters.status;
    if (filters?.categoryId) prismaFilters.categoryId = filters.categoryId;
    if (filters?.merchant) prismaFilters.merchant = { contains: filters.merchant, mode: 'insensitive' };
    if (filters?.startDate || filters?.endDate) {
      prismaFilters.expenseDate = {};
      if (filters.startDate) prismaFilters.expenseDate.gte = new Date(filters.startDate);
      if (filters.endDate) prismaFilters.expenseDate.lte = new Date(filters.endDate);
    }
    if (filters?.minAmount || filters?.maxAmount) {
      prismaFilters.convertedAmount = {};
      if (filters.minAmount) prismaFilters.convertedAmount.gte = filters.minAmount;
      if (filters.maxAmount) prismaFilters.convertedAmount.lte = filters.maxAmount;
    }

    return this.repo.findMany(
      companyId,
      effectiveUserId,
      (pagination.page - 1) * pagination.limit,
      pagination.limit,
      { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc' },
      prismaFilters
    );
  }

  async update(id: string, companyId: string, userId: string, dto: UpdateExpenseDto) {
    const expense = await this.getById(id, companyId);

    // Only draft expenses can be updated
    if (expense.status !== 'DRAFT') {
      throw new AppError('Only draft expenses can be updated', 400);
    }

    // If amount or currency changed, re-convert
    let updateData: any = { ...dto };
    if (dto.amount || dto.currency) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { defaultCurrency: true },
      });
      if (company) {
        const { convertedAmount, exchangeRate } = await convertCurrency(
          dto.amount || expense.amount,
          dto.currency || expense.currency,
          company.defaultCurrency
        );
        updateData.convertedAmount = convertedAmount;
        updateData.exchangeRate = exchangeRate;
      }
    }

    return this.repo.update(id, updateData);
  }

  async delete(id: string, companyId: string) {
    const expense = await this.getById(id, companyId);
    if (expense.status !== 'DRAFT') {
      throw new AppError('Only draft expenses can be deleted', 400);
    }
    return this.repo.delete(id);
  }

  async getDuplicates(id: string, companyId: string) {
    await this.getById(id, companyId);
    return prisma.duplicateDetection.findMany({
      where: { expenseId: id },
      include: {
        duplicateExpense: {
          select: { id: true, description: true, merchant: true, amount: true, currency: true, expenseDate: true },
        },
      },
    });
  }
}
