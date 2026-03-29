import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export class DepartmentRepository {
  async create(data: Prisma.DepartmentUncheckedCreateInput) {
    return prisma.department.create({
      data,
      include: { head: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.department.findFirst({
      where: { id, companyId },
      include: {
        head: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async findMany(companyId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      prisma.department.findMany({
        where: { companyId },
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          head: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { members: true } },
        },
      }),
      prisma.department.count({ where: { companyId } }),
    ]);
    return { data, total };
  }

  async update(id: string, data: Prisma.DepartmentUncheckedUpdateInput) {
    return prisma.department.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.department.update({ where: { id }, data: { isActive: false } });
  }

  async getDepartmentExpenses(departmentId: string, companyId: string) {
    return prisma.expense.findMany({
      where: {
        companyId,
        user: { departmentId },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
    });
  }
}
