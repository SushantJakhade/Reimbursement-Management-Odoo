import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export class ReportRepository {
  async create(data: Prisma.ExpenseReportUncheckedCreateInput) {
    return prisma.expenseReport.create({
      data,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.expenseReport.findFirst({
      where: { id, companyId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        expenses: {
          include: {
            category: { select: { id: true, name: true, icon: true } },
            receipts: true,
          },
        },
      },
    });
  }

  async findMany(companyId: string, userId: string | null, skip: number, take: number, filters?: any) {
    const where: Prisma.ExpenseReportWhereInput = {
      companyId,
      ...(userId && { userId }),
      ...filters,
    };

    const [data, total] = await Promise.all([
      prisma.expenseReport.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { expenses: true } },
        },
      }),
      prisma.expenseReport.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: Prisma.ExpenseReportUncheckedUpdateInput) {
    return prisma.expenseReport.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.expenseReport.delete({ where: { id } });
  }

  async recalculateTotals(reportId: string) {
    const expenses = await prisma.expense.findMany({
      where: { reportId },
      select: { amount: true, convertedAmount: true },
    });

    const totalAmount = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
    const totalConverted = expenses.reduce((sum: number, e: { convertedAmount: number }) => sum + e.convertedAmount, 0);

    return prisma.expenseReport.update({
      where: { id: reportId },
      data: {
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalConverted: Math.round(totalConverted * 100) / 100,
      },
    });
  }
}
