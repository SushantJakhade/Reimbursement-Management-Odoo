import prisma from '../../config/database';

export class ReceiptRepository {
  async create(data: { expenseId: string; fileUrl: string; fileName: string; mimeType: string; fileSize: number }) {
    return prisma.receipt.create({ data });
  }

  async findById(id: string) {
    return prisma.receipt.findUnique({
      where: { id },
      include: { ocrResult: { include: { categoryMatches: { include: { category: true } } } } },
    });
  }

  async findByExpenseId(expenseId: string) {
    return prisma.receipt.findMany({
      where: { expenseId },
      include: { ocrResult: true },
    });
  }

  async delete(id: string) {
    return prisma.receipt.delete({ where: { id } });
  }
}
