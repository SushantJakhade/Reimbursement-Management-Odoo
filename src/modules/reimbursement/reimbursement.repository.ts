import prisma from '../../config/database';

export class ReimbursementRepository {
  async findById(id: string, companyId: string) {
    return prisma.reimbursement.findFirst({
      where: { id, companyId },
      include: {
        expense: { select: { id: true, description: true, merchant: true, amount: true, currency: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findMany(companyId: string, userId: string | null, skip: number, take: number, filters?: any) {
    const where: any = { companyId, ...(userId && { userId }), ...filters };
    const [data, total] = await Promise.all([
      prisma.reimbursement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          expense: { select: { id: true, description: true, merchant: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.reimbursement.count({ where }),
    ]);
    return { data, total };
  }

  async update(id: string, data: any) {
    return prisma.reimbursement.update({ where: { id }, data });
  }
}
