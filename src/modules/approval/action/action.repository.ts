import prisma from '../../../config/database';

export class ActionRepository {
  async create(data: {
    workflowId: string;
    stepId: string;
    approverId: string;
    action: 'APPROVE' | 'REJECT' | 'DELEGATE' | 'REQUEST_INFO';
    comments?: string;
  }) {
    return prisma.approvalAction.create({
      data,
      include: {
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findByWorkflow(workflowId: string) {
    return prisma.approvalAction.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'asc' },
      include: {
        approver: { select: { id: true, firstName: true, lastName: true } },
        step: true,
      },
    });
  }

  async getHistory(companyId: string, approverId: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      prisma.approvalAction.findMany({
        where: {
          approverId,
          workflow: { expense: { companyId } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          workflow: {
            include: {
              expense: { select: { id: true, description: true, amount: true, currency: true } },
            },
          },
        },
      }),
      prisma.approvalAction.count({
        where: {
          approverId,
          workflow: { expense: { companyId } },
        },
      }),
    ]);

    return { data, total };
  }
}
