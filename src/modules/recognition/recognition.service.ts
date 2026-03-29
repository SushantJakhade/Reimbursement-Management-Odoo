import { RecognitionRepository } from './recognition.repository';
import { PaginationParams } from '../../shared/utils/pagination';

export class RecognitionService {
  private repo = new RecognitionRepository();

  async getPoints(userId: string) {
    return { totalPoints: await this.repo.getPointsBalance(userId) };
  }

  async getHistory(userId: string, companyId: string, pagination: PaginationParams) {
    return this.repo.getLedger(
      userId,
      companyId,
      (pagination.page - 1) * pagination.limit,
      pagination.limit
    );
  }

  async getLeaderboard(companyId: string) {
    return this.repo.getLeaderboard(companyId);
  }
}
