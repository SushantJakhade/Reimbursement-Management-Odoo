import prisma from '../../config/database';

export class NotificationRepository {
  async findMany(userId: string, companyId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, companyId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId, companyId } }),
    ]);
    return { data, total };
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, companyId: string) {
    return prisma.notification.updateMany({
      where: { userId, companyId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string, companyId: string) {
    return prisma.notification.count({
      where: { userId, companyId, isRead: false },
    });
  }
}
