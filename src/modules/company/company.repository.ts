import prisma from '../../config/database';

export class CompanyRepository {
  async findById(id: string) {
    return prisma.company.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return prisma.company.update({ where: { id }, data });
  }

  async getStats(companyId: string) {
    const [userCount, departmentCount, expenseCount, pendingApprovals, totalExpenseAmount] =
      await Promise.all([
        prisma.user.count({ where: { companyId, isActive: true } }),
        prisma.department.count({ where: { companyId, isActive: true } }),
        prisma.expense.count({ where: { companyId } }),
        prisma.approvalWorkflow.count({
          where: { expense: { companyId }, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        }),
        prisma.expense.aggregate({
          where: { companyId, status: 'APPROVED' },
          _sum: { convertedAmount: true },
        }),
      ]);

    return {
      userCount,
      departmentCount,
      expenseCount,
      pendingApprovals,
      totalExpenseAmount: totalExpenseAmount._sum.convertedAmount || 0,
    };
  }
}
