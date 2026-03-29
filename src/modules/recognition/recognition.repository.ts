import prisma from '../../config/database';

export class RecognitionRepository {
  async getPointsBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true },
    });
    return user?.totalPoints || 0;
  }

  async getLedger(userId: string, companyId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      prisma.recognitionPointsLedger.findMany({
        where: { userId, companyId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          expense: { select: { id: true, description: true, amount: true } },
        },
      }),
      prisma.recognitionPointsLedger.count({ where: { userId, companyId } }),
    ]);
    return { data, total };
  }

  async getLeaderboard(companyId: string, limit: number = 10) {
    return prisma.user.findMany({
      where: { companyId, isActive: true, totalPoints: { gt: 0 } },
      orderBy: { totalPoints: 'desc' },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        totalPoints: true,
        department: { select: { name: true } },
      },
    });
  }
}
