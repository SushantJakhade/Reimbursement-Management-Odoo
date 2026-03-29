import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';

export class AnalyticsService {
  async getDashboardMetrics(companyId: string, userId: string, role: string) {
    const isEmployee = role === 'EMPLOYEE';
    const whereClause: any = { companyId };
    if (isEmployee) whereClause.userId = userId;

    // 1. Total Expenses
    const totalExpenses = await prisma.expense.count({ where: whereClause });

    // 2. Pending Approvals
    const pendingApprovals = await prisma.expense.count({
      where: {
        ...whereClause,
        status: { in: ['SUBMITTED', 'DRAFT'] }
      }
    });

    // 3. Current Month Spend
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyAggregate = await prisma.expense.aggregate({
      where: {
        ...whereClause,
        expenseDate: { gte: firstDayOfMonth },
        status: { not: 'REJECTED' } // Don't count rejected spend
      },
      _sum: { convertedAmount: true }
    });
    const monthlySpend = monthlyAggregate._sum.convertedAmount || 0;

    // 4. Trend Data for the past 6 months
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const sumAggregate = await prisma.expense.aggregate({
        where: {
          ...whereClause,
          expenseDate: { gte: monthStart, lt: nextMonth },
          status: { not: 'REJECTED' }
        },
        _sum: { convertedAmount: true }
      });
      
      trendData.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        amount: sumAggregate._sum.convertedAmount || 0
      });
    }

    return {
      totalExpenses,
      pendingApprovals,
      monthlySpend,
      monthlyTrendData: trendData
    };
  }
}
