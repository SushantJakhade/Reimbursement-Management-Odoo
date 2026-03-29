import { WorkflowRepository } from './workflow.repository';
import { RuleRepository } from '../rule/rule.repository';
import { NotFoundError, AppError } from '../../../shared/middleware/error.middleware';
import { PaginationParams } from '../../../shared/utils/pagination';
import prisma from '../../../config/database';

export class WorkflowService {
  private repo = new WorkflowRepository();
  private ruleRepo = new RuleRepository();

  /**
   * Create an approval workflow for an expense
   * Called when an expense is submitted
   */
  async createForExpense(companyId: string, expenseId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, companyId },
      include: { user: { select: { managerId: true, departmentId: true } } },
    });

    if (!expense) throw new NotFoundError('Expense');

    // Find matching approval rule
    const rule = await this.ruleRepo.findMatchingRule(
      companyId,
      expense.convertedAmount,
      expense.categoryId || undefined,
      expense.user.departmentId || undefined
    );

    if (!rule || rule.steps.length === 0) {
      // No rule — auto-approve
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: 'APPROVED' },
      });
      return null;
    }

    // Create workflow
    const workflow = await this.repo.create({
      expenseId,
      ruleId: rule.id,
      totalSteps: rule.steps.length,
    });

    // Update expense status
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'UNDER_REVIEW' },
    });

    // Send notification to first approver
    await this.notifyApprover(workflow.id, rule.steps[0], expense);

    return workflow;
  }

  async getById(id: string) {
    const workflow = await this.repo.findById(id);
    if (!workflow) throw new NotFoundError('Approval Workflow');
    return workflow;
  }

  async list(companyId: string, pagination: PaginationParams, filters?: any) {
    return this.repo.findMany(
      companyId,
      (pagination.page - 1) * pagination.limit,
      pagination.limit,
      filters
    );
  }

  async getPendingForUser(userId: string, companyId: string) {
    return this.repo.findPendingForApprover(userId, companyId);
  }

  private async notifyApprover(workflowId: string, step: any, expense: any) {
    let approverId: string | null = null;

    if (step.approverType === 'MANAGER') {
      const user = await prisma.user.findUnique({
        where: { id: expense.userId },
        select: { managerId: true },
      });
      approverId = user?.managerId || null;
    } else if (step.approverType === 'SPECIFIC_USER') {
      approverId = step.approverId;
    }

    if (approverId) {
      await prisma.notification.create({
        data: {
          userId: approverId,
          companyId: expense.companyId,
          type: 'APPROVAL_REQUEST',
          title: 'New Expense Approval Request',
          message: `Expense "${expense.description}" ($${expense.convertedAmount}) requires your approval.`,
          data: { workflowId, expenseId: expense.id },
        },
      });
    }
  }
}
