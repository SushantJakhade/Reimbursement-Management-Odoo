import prisma from '../../../config/database';

export class WorkflowRepository {
  async create(data: { expenseId: string; ruleId: string; totalSteps: number }) {
    return prisma.approvalWorkflow.create({
      data: { ...data, status: 'PENDING' },
      include: {
        expense: { select: { id: true, description: true, amount: true, currency: true } },
        rule: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
      },
    });
  }

  async findById(id: string) {
    return prisma.approvalWorkflow.findUnique({
      where: { id },
      include: {
        expense: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            category: true,
          },
        },
        rule: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
        actions: {
          orderBy: { createdAt: 'asc' },
          include: { approver: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
  }

  async findMany(companyId: string, skip: number, take: number, filters?: any) {
    const where: any = {
      expense: { companyId },
      ...filters,
    };

    const [data, total] = await Promise.all([
      prisma.approvalWorkflow.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          expense: {
            select: { id: true, description: true, amount: true, currency: true, convertedAmount: true, companyCurrency: true,
              user: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          rule: { select: { id: true, name: true } },
          _count: { select: { actions: true } },
        },
      }),
      prisma.approvalWorkflow.count({ where }),
    ]);

    return { data, total };
  }

  async findPendingForApprover(approverId: string, companyId: string) {
    // Find workflows where the current step's approver matches
    const workflows = await prisma.approvalWorkflow.findMany({
      where: {
        expense: { companyId },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: {
        expense: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, managerId: true } },
            category: { select: { id: true, name: true, icon: true } },
          },
        },
        rule: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
        actions: true,
      },
    });

    // Filter to only those where this approver is responsible for the current step
    return workflows.filter((wf) => {
      const currentStep = wf.rule.steps.find((s) => s.stepOrder === wf.currentStep);
      if (!currentStep) return false;

      switch (currentStep.approverType) {
        case 'MANAGER':
          return wf.expense.user.managerId === approverId;
        case 'SPECIFIC_USER':
          return currentStep.approverId === approverId;
        case 'DEPARTMENT_HEAD':
          // Would need department head lookup — simplified here
          return true;
        case 'ROLE':
          // Would filter by role — simplified
          return true;
        default:
          return false;
      }
    });
  }

  async update(id: string, data: any) {
    return prisma.approvalWorkflow.update({ where: { id }, data });
  }
}
