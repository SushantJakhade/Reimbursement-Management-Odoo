import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export class BudgetRepository {
  async create(data: Prisma.BudgetUncheckedCreateInput) {
    return prisma.budget.create({ data });
  }

  async findById(id: string, companyId: string) {
    return prisma.budget.findFirst({
      where: { id, companyId },
      include: {
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findMany(companyId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      prisma.budget.findMany({
        where: { companyId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { alerts: true } },
        },
      }),
      prisma.budget.count({ where: { companyId } }),
    ]);
    return { data, total };
  }

  async update(id: string, data: Prisma.BudgetUncheckedUpdateInput) {
    return prisma.budget.update({ where: { id }, data });
  }

  async getUsage(budgetId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      prisma.budgetUsage.findMany({
        where: { budgetId },
        skip,
        take,
        orderBy: { recordedAt: 'desc' },
        include: {
          expense: {
            select: { id: true, description: true, merchant: true, amount: true, currency: true },
          },
        },
      }),
      prisma.budgetUsage.count({ where: { budgetId } }),
    ]);
    return { data, total };
  }

  async getAlerts(budgetId: string) {
    return prisma.budgetAlert.findMany({
      where: { budgetId },
      orderBy: { triggeredAt: 'desc' },
    });
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    return prisma.budgetAlert.update({
      where: { id: alertId },
      data: { acknowledgedById: userId, acknowledgedAt: new Date() },
    });
  }
}
