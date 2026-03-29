import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export class ExpenseRepository {
  async create(data: Prisma.ExpenseUncheckedCreateInput) {
    return prisma.expense.create({
      data,
      include: {
        category: { select: { id: true, name: true, icon: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        receipts: true,
      },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.expense.findFirst({
      where: { id, companyId },
      include: {
        category: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        receipts: { include: { ocrResult: true } },
        approvalWorkflows: { include: { actions: { include: { approver: { select: { id: true, firstName: true, lastName: true } } } } } },
        reimbursement: true,
      },
    });
  }

  async findMany(companyId: string, userId: string | null, skip: number, take: number, orderBy: any, filters?: any) {
    const where: Prisma.ExpenseWhereInput = {
      companyId,
      ...(userId && { userId }),
      ...filters,
    };

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true, icon: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: Prisma.ExpenseUncheckedUpdateInput) {
    return prisma.expense.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.expense.delete({ where: { id } });
  }

  async findPotentialDuplicates(companyId: string, merchant: string | undefined, amount: number, date: Date) {
    if (!merchant) return [];

    const dateStart = new Date(date);
    dateStart.setDate(dateStart.getDate() - 3);
    const dateEnd = new Date(date);
    dateEnd.setDate(dateEnd.getDate() + 3);

    return prisma.expense.findMany({
      where: {
        companyId,
        merchant: { contains: merchant, mode: 'insensitive' },
        amount: { gte: amount * 0.95, lte: amount * 1.05 },
        expenseDate: { gte: dateStart, lte: dateEnd },
      },
      take: 5,
    });
  }
}
