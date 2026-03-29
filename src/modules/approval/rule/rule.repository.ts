import prisma from '../../../config/database';

export class RuleRepository {
  async create(companyId: string, data: any) {
    const { steps, ...ruleData } = data;
    return prisma.approvalRule.create({
      data: {
        ...ruleData,
        companyId,
        steps: {
          create: steps,
        },
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.approvalRule.findFirst({
      where: { id, companyId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  }

  async findMany(companyId: string) {
    return prisma.approvalRule.findMany({
      where: { companyId },
      orderBy: { priority: 'asc' },
      include: { steps: { orderBy: { stepOrder: 'asc' } }, _count: { select: { workflows: true } } },
    });
  }

  async update(id: string, data: any) {
    return prisma.approvalRule.update({ where: { id }, data });
  }

  async addStep(ruleId: string, data: any) {
    return prisma.approvalRuleStep.create({ data: { ...data, ruleId } });
  }

  async updateStep(stepId: string, data: any) {
    return prisma.approvalRuleStep.update({ where: { id: stepId }, data });
  }

  async deleteStep(stepId: string) {
    return prisma.approvalRuleStep.delete({ where: { id: stepId } });
  }

  /**
   * Find matching approval rule for an expense
   */
  async findMatchingRule(companyId: string, amount: number, categoryId?: string, departmentId?: string) {
    const rules = await prisma.approvalRule.findMany({
      where: { companyId, isActive: true },
      orderBy: { priority: 'asc' },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    for (const rule of rules) {
      const cv = rule.conditionValue as any;

      switch (rule.conditionType) {
        case 'AMOUNT_THRESHOLD':
          if (amount >= (cv.minAmount || 0) && (!cv.maxAmount || amount <= cv.maxAmount)) {
            return rule;
          }
          break;
        case 'CATEGORY':
          if (cv.categoryIds?.includes(categoryId)) return rule;
          break;
        case 'DEPARTMENT':
          if (cv.departmentIds?.includes(departmentId)) return rule;
          break;
        case 'CUSTOM':
          return rule; // fallback
      }
    }

    return rules[0] || null; // default to first rule
  }
}
