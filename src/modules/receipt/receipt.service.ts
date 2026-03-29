import path from 'path';
import { ReceiptRepository } from './receipt.repository';
import { NotFoundError } from '../../shared/middleware/error.middleware';
import { env } from '../../config/env';

export class ReceiptService {
  private repo = new ReceiptRepository();

  async uploadReceipt(expenseId: string, file: Express.Multer.File) {
    const fileUrl = `/${env.uploadDir}/${file.filename}`;

    const receipt = await this.repo.create({
      expenseId,
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return receipt;
  }

  async getReceipt(id: string) {
    const receipt = await this.repo.findById(id);
    if (!receipt) throw new NotFoundError('Receipt');
    return receipt;
  }

  async getByExpense(expenseId: string) {
    return this.repo.findByExpenseId(expenseId);
  }

  async deleteReceipt(id: string) {
    const receipt = await this.repo.findById(id);
    if (!receipt) throw new NotFoundError('Receipt');
    return this.repo.delete(id);
  }
}
