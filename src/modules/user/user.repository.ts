import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export class UserRepository {
  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: { department: true, manager: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.user.findFirst({
      where: { id, companyId },
      include: {
        department: true,
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findMany(companyId: string, skip: number, take: number, orderBy: any, filters?: any) {
    const where: Prisma.UserWhereInput = { companyId, ...filters };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          department: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, companyId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: { department: true },
    });
  }

  async deactivate(id: string, companyId: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getPointsLedger(userId: string, companyId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      prisma.recognitionPointsLedger.findMany({
        where: { userId, companyId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recognitionPointsLedger.count({ where: { userId, companyId } }),
    ]);
    return { data, total };
  }

  async checkEmailExists(companyId: string, email: string) {
    return prisma.user.findUnique({
      where: { companyId_email: { companyId, email } },
    });
  }
}
