import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export class AuthRepository {
  async findUserByEmail(companyId: string, email: string) {
    return prisma.user.findUnique({
      where: { companyId_email: { companyId, email } },
      include: { company: true },
    });
  }

  async findUserByEmailAcrossCompanies(email: string) {
    return prisma.user.findFirst({
      where: { email },
      include: { company: true },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { company: true, department: true },
    });
  }

  async createCompanyWithAdmin(data: {
    companyName: string;
    slug: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    country?: string;
    defaultCurrency: string;
    phone?: string;
    categories: Prisma.ExpenseCategoryCreateWithoutCompanyInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          slug: data.slug,
          email: data.email,
          country: data.country,
          defaultCurrency: data.defaultCurrency,
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'ADMIN',
          phone: data.phone,
        },
      });

      // Create default expense categories
      if (data.categories.length > 0) {
        await tx.expenseCategory.createMany({
          data: data.categories.map((cat) => ({
            ...cat,
            companyId: company.id,
          })),
        });
      }

      // Create default approval rule (manager-first)
      const rule = await tx.approvalRule.create({
        data: {
          companyId: company.id,
          name: 'Default Manager Approval',
          description: 'All expenses require manager approval',
          conditionType: 'AMOUNT_THRESHOLD',
          conditionValue: { minAmount: 0 },
          priority: 1,
        },
      });

      await tx.approvalRuleStep.create({
        data: {
          ruleId: rule.id,
          stepOrder: 1,
          approverType: 'MANAGER',
          requiredApprovalPercent: 100,
        },
      });

      return { company, user };
    });
  }

  async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
