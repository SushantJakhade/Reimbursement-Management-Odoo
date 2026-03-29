import { NotificationRepository } from './notification.repository';
import { PaginationParams } from '../../shared/utils/pagination';

export class NotificationService {
  private repo = new NotificationRepository();

  async list(userId: string, companyId: string, pagination: PaginationParams) {
    return this.repo.findMany(
      userId,
      companyId,
      (pagination.page - 1) * pagination.limit,
      pagination.limit
    );
  }

  async markAsRead(id: string, userId: string) {
    return this.repo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string, companyId: string) {
    return this.repo.markAllAsRead(userId, companyId);
  }

  async getUnreadCount(userId: string, companyId: string) {
    return { count: await this.repo.getUnreadCount(userId, companyId) };
  }
}
