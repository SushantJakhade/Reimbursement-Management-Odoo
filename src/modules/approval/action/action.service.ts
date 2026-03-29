import { ActionRepository } from './action.repository';
import { AppError, NotFoundError } from '../../../shared/middleware/error.middleware';
import { TakeActionDto } from './action.dto';
import { PaginationParams } from '../../../shared/utils/pagination';
import prisma from '../../../config/database';
import { logger } from '../../../shared/utils/logger';

export class ActionService {
  private repo = new ActionRepository();

  /**
   * Take an approval action (approve/reject/delegate/request info)
   * This is the core approval engine logic
   */
  async takeAction(companyId: string, approverId: string, dto: TakeActionDto) {
    return prisma.$transaction(async (tx) => {
      // Get workflow with rule steps
      const workflow = await tx.approvalWorkflow.findUnique({
        where: { id: dto.workflowId },
        include: {
          expense: { include: { user: true } },
          rule: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
        },
      });

      if (!workflow) throw new NotFoundError('Approval Workflow');
      if (workflow.status !== 'PENDING' && workflow.status !== 'IN_PROGRESS') {
        throw new AppError('This workflow is no longer active', 400);
      }

      // Get current step
      const currentStep = workflow.rule.steps.find((s) => s.stepOrder === workflow.currentStep);
      if (!currentStep) throw new AppError('Invalid workflow state', 500);

      // Record the action
      const action = await tx.approvalAction.create({
        data: {
          workflowId: dto.workflowId,
          stepId: currentStep.id,
          approverId,
          action: dto.action,
          comments: dto.comments,
        },
      });

      if (dto.action === 'APPROVE') {
        if (workflow.currentStep >= workflow.totalSteps) {
          // ✅ Final approval — complete the workflow
          await tx.approvalWorkflow.update({
            where: { id: dto.workflowId },
            data: { status: 'APPROVED', completedAt: new Date() },
          });

          // Update expense status
          await tx.expense.update({
            where: { id: workflow.expenseId },
            data: { status: 'APPROVED' },
          });

          // Check and update budget
          await this.handleBudgetUpdate(tx, workflow.expense);

          // Create reimbursement
          await tx.reimbursement.create({
            data: {
              expenseId: workflow.expenseId,
              userId: workflow.expense.userId,
              companyId,
              amount: workflow.expense.convertedAmount,
              currency: workflow.expense.companyCurrency,
              status: 'PENDING',
            },
          });

          // Award recognition points
          await this.awardPoints(tx, workflow.expense);

          // Notify submitter
          await tx.notification.create({
            data: {
              userId: workflow.expense.userId,
              companyId,
              type: 'APPROVED',
              title: 'Expense Approved',
              message: `Your expense "${workflow.expense.description}" has been approved!`,
              data: { expenseId: workflow.expenseId },
            },
          });

          logger.info('Expense approved', { expenseId: workflow.expenseId, workflowId: dto.workflowId });
        } else {
          // ➡️ Advance to next step
          const nextStep = workflow.currentStep + 1;
          await tx.approvalWorkflow.update({
            where: { id: dto.workflowId },
            data: { currentStep: nextStep, status: 'IN_PROGRESS' },
          });

          // Notify next approver
          const nextStepDef = workflow.rule.steps.find((s) => s.stepOrder === nextStep);
          if (nextStepDef?.approverId) {
            await tx.notification.create({
              data: {
                userId: nextStepDef.approverId,
                companyId,
                type: 'APPROVAL_REQUEST',
                title: 'Expense Approval Required',
                message: `Expense "${workflow.expense.description}" needs your approval (Step ${nextStep}/${workflow.totalSteps}).`,
                data: { workflowId: dto.workflowId, expenseId: workflow.expenseId },
              },
            });
          }
        }
      } else if (dto.action === 'REJECT') {
        // ❌ Reject — end workflow
        await tx.approvalWorkflow.update({
          where: { id: dto.workflowId },
          data: { status: 'REJECTED', completedAt: new Date() },
        });

        await tx.expense.update({
          where: { id: workflow.expenseId },
          data: { status: 'REJECTED' },
        });

        // Notify submitter
        await tx.notification.create({
          data: {
            userId: workflow.expense.userId,
            companyId,
            type: 'REJECTED',
            title: 'Expense Rejected',
            message: `Your expense "${workflow.expense.description}" was rejected. ${dto.comments ? `Reason: ${dto.comments}` : ''}`,
            data: { expenseId: workflow.expenseId },
          },
        });

        logger.info('Expense rejected', { expenseId: workflow.expenseId, workflowId: dto.workflowId });
      }

      return action;
    });
  }

  async getHistory(companyId: string, userId: string, pagination: PaginationParams) {
    return this.repo.getHistory(
      companyId,
      userId,
      (pagination.page - 1) * pagination.limit,
      pagination.limit
    );
  }

  /**
   * Update budget usage after expense approval
   */
  private async handleBudgetUpdate(tx: any, expense: any) {
    const budgets = await tx.budget.findMany({
      where: {
        companyId: expense.companyId,
        isActive: true,
        startDate: { lte: expense.expenseDate },
        endDate: { gte: expense.expenseDate },
        OR: [
          { userId: expense.userId },
          { departmentId: expense.user?.departmentId },
          { categoryId: expense.categoryId },
          { userId: null, departmentId: null, categoryId: null }, // company-wide
        ],
      },
    });

    for (const budget of budgets) {
      const newSpent = budget.spent + expense.convertedAmount;
      const percentUsed = (newSpent / budget.amount) * 100;

      // Update budget spent
      await tx.budget.update({
        where: { id: budget.id },
        data: { spent: newSpent },
      });

      // Record usage
      await tx.budgetUsage.create({
        data: {
          budgetId: budget.id,
          expenseId: expense.id,
          amount: expense.convertedAmount,
        },
      });

      // Check thresholds and create alerts
      if (percentUsed >= budget.alertThreshold) {
        const alertType = percentUsed >= 100 ? 'EXCEEDED' : percentUsed >= 90 ? 'NEAR_LIMIT' : 'THRESHOLD';

        await tx.budgetAlert.create({
          data: {
            budgetId: budget.id,
            type: alertType,
            message: `Budget "${budget.name}" is at ${percentUsed.toFixed(1)}% utilization ($${newSpent.toFixed(2)} of $${budget.amount.toFixed(2)}).`,
            percentUsed,
          },
        });

        // Notify relevant users about budget alert
        const notifyUsers = await tx.user.findMany({
          where: {
            companyId: expense.companyId,
            role: { in: ['ADMIN', 'MANAGER'] },
            isActive: true,
          },
          select: { id: true },
          take: 10,
        });

        for (const user of notifyUsers) {
          await tx.notification.create({
            data: {
              userId: user.id,
              companyId: expense.companyId,
              type: 'BUDGET_ALERT',
              title: `Budget Alert: ${budget.name}`,
              message: `Budget is at ${percentUsed.toFixed(1)}% utilization.`,
              data: { budgetId: budget.id, percentUsed },
            },
          });
        }
      }
    }
  }

  /**
   * Award recognition points for cost-efficient expenses
   */
  private async awardPoints(tx: any, expense: any) {
    if (!expense.categoryId) return;

    const category = await tx.expenseCategory.findUnique({
      where: { id: expense.categoryId },
    });

    if (!category?.maxAmount) return;

    const thresholdPercent = 80; // Below 80% of max = earn points
    const percentUsed = (expense.convertedAmount / category.maxAmount) * 100;

    if (percentUsed < thresholdPercent) {
      const savingPercent = thresholdPercent - percentUsed;
      const points = Math.round(savingPercent * 0.5); // 0.5 points per % saved

      if (points > 0) {
        // Get current balance
        const user = await tx.user.findUnique({
          where: { id: expense.userId },
          select: { totalPoints: true },
        });

        const newBalance = (user?.totalPoints || 0) + points;

        // Update user total
        await tx.user.update({
          where: { id: expense.userId },
          data: { totalPoints: newBalance },
        });

        // Record in ledger
        await tx.recognitionPointsLedger.create({
          data: {
            userId: expense.userId,
            companyId: expense.companyId,
            expenseId: expense.id,
            points,
            type: 'EARNED',
            reason: `Cost-efficient expense: ${percentUsed.toFixed(0)}% of ${category.name} budget used`,
            balanceAfter: newBalance,
          },
        });

        // Notify user
        await tx.notification.create({
          data: {
            userId: expense.userId,
            companyId: expense.companyId,
            type: 'POINTS_EARNED',
            title: 'Points Earned! 🎉',
            message: `You earned ${points} points for cost-efficient spending!`,
            data: { points, balanceAfter: newBalance },
          },
        });
      }
    }
  }
}
