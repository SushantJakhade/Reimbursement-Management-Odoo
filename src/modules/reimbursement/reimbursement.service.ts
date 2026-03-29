import { ReimbursementRepository } from './reimbursement.repository';
import { NotFoundError, AppError } from '../../shared/middleware/error.middleware';
import { generateReferenceNumber } from '../../shared/utils/crypto';
import { PaginationParams } from '../../shared/utils/pagination';
import prisma from '../../config/database';

export class ReimbursementService {
  private repo = new ReimbursementRepository();

  async getById(id: string, companyId: string) {
    const reimbursement = await this.repo.findById(id, companyId);
    if (!reimbursement) throw new NotFoundError('Reimbursement');
    return reimbursement;
  }

  async list(companyId: string, userId: string | null, role: string, pagination: PaginationParams, filters?: any) {
    const effectiveUserId = role === 'EMPLOYEE' ? userId : null;
    const prismaFilters: any = {};
    if (filters?.status) prismaFilters.status = filters.status;

    return this.repo.findMany(
      companyId,
      effectiveUserId,
      (pagination.page - 1) * pagination.limit,
      pagination.limit,
      prismaFilters
    );
  }

  async processPayment(id: string, companyId: string, dto: any) {
    const reimbursement = await this.getById(id, companyId);
    if (reimbursement.status !== 'PENDING') {
      throw new AppError('Only pending reimbursements can be processed', 400);
    }

    const refNumber = generateReferenceNumber('PAY');

    const updated = await this.repo.update(id, {
      status: 'PROCESSING',
      paymentMethod: dto.paymentMethod || reimbursement.paymentMethod,
      referenceNumber: refNumber,
      processedAt: new Date(),
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: reimbursement.userId,
        companyId,
        type: 'PAYMENT_UPDATE',
        title: 'Payment Processing',
        message: `Your reimbursement of $${reimbursement.amount} is being processed. Reference: ${refNumber}`,
        data: { reimbursementId: id, referenceNumber: refNumber },
      },
    });

    return updated;
  }

  async updateStatus(id: string, companyId: string, dto: any) {
    const reimbursement = await this.getById(id, companyId);

    const updated = await this.repo.update(id, {
      status: dto.status,
      ...(dto.referenceNumber && { referenceNumber: dto.referenceNumber }),
      ...(dto.failureReason && { failureReason: dto.failureReason }),
      ...(dto.status === 'COMPLETED' && { processedAt: new Date() }),
    });

    // Update expense status if completed
    if (dto.status === 'COMPLETED') {
      await prisma.expense.update({
        where: { id: reimbursement.expenseId },
        data: { status: 'PAID' },
      });

      await prisma.notification.create({
        data: {
          userId: reimbursement.userId,
          companyId,
          type: 'PAYMENT_UPDATE',
          title: 'Payment Completed ✅',
          message: `Your reimbursement of $${reimbursement.amount} has been paid!`,
          data: { reimbursementId: id },
        },
      });
    }

    return updated;
  }
}
