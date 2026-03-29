import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Travel', code: 'TRAVEL', icon: '✈️', maxAmount: 5000, requiresReceipt: true },
  { name: 'Meals', code: 'MEALS', icon: '🍽️', maxAmount: 200, requiresReceipt: true },
  { name: 'Office Supplies', code: 'SUPPLIES', icon: '📦', maxAmount: 500, requiresReceipt: false },
  { name: 'Software', code: 'SOFTWARE', icon: '💻', maxAmount: 1000, requiresReceipt: true },
  { name: 'Transportation', code: 'TRANSPORT', icon: '🚗', maxAmount: 300, requiresReceipt: true },
  { name: 'Accommodation', code: 'ACCOMMODATION', icon: '🏨', maxAmount: 3000, requiresReceipt: true },
  { name: 'Communication', code: 'COMMUNICATION', icon: '📱', maxAmount: 200, requiresReceipt: false },
  { name: 'Training', code: 'TRAINING', icon: '📚', maxAmount: 2000, requiresReceipt: true },
  { name: 'Entertainment', code: 'ENTERTAINMENT', icon: '🎭', maxAmount: 500, requiresReceipt: true },
  { name: 'Miscellaneous', code: 'MISC', icon: '📋', maxAmount: 250, requiresReceipt: false },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Company ──────────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      email: 'admin@acme.com',
      defaultCurrency: 'USD',
      country: 'US',
      plan: 'PROFESSIONAL',
    },
  });
  console.log('✅ Company: Acme Corp');

  // ─── Departments ──────────────────────────────────────────
  const engineering = await prisma.department.create({
    data: { companyId: company.id, name: 'Engineering', code: 'ENG', budget: 50000 },
  });

  const sales = await prisma.department.create({
    data: { companyId: company.id, name: 'Sales', code: 'SALES', budget: 30000 },
  });

  const finance = await prisma.department.create({
    data: { companyId: company.id, name: 'Finance', code: 'FIN', budget: 20000 },
  });
  console.log('✅ Departments: Engineering, Sales, Finance');

  // ─── Users ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      departmentId: finance.id,
      email: 'admin@acme.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Admin',
      role: 'ADMIN',
      designation: 'CEO',
    },
  });

  const manager = await prisma.user.create({
    data: {
      companyId: company.id,
      departmentId: engineering.id,
      managerId: admin.id,
      email: 'manager@acme.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Manager',
      role: 'MANAGER',
      designation: 'Engineering Manager',
    },
  });

  const employee = await prisma.user.create({
    data: {
      companyId: company.id,
      departmentId: engineering.id,
      managerId: manager.id,
      email: 'employee@acme.com',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Employee',
      role: 'EMPLOYEE',
      designation: 'Software Engineer',
    },
  });

  const salesRep = await prisma.user.create({
    data: {
      companyId: company.id,
      departmentId: sales.id,
      managerId: admin.id,
      email: 'sales@acme.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Sales',
      role: 'EMPLOYEE',
      designation: 'Sales Representative',
    },
  });
  console.log('✅ Users: admin, manager, employee, sales rep');

  // Update department heads
  await prisma.department.update({ where: { id: engineering.id }, data: { headId: manager.id } });
  await prisma.department.update({ where: { id: finance.id }, data: { headId: admin.id } });

  // ─── Expense Categories ───────────────────────────────────
  const categories = await Promise.all(
    DEFAULT_CATEGORIES.map((cat) =>
      prisma.expenseCategory.create({
        data: { ...cat, companyId: company.id },
      })
    )
  );
  console.log(`✅ ${categories.length} Expense Categories`);

  // ─── Approval Rules ───────────────────────────────────────
  const lowRule = await prisma.approvalRule.create({
    data: {
      companyId: company.id,
      name: 'Low Value - Manager Only',
      description: 'Expenses under $500 need manager approval',
      conditionType: 'AMOUNT_THRESHOLD',
      conditionValue: { minAmount: 0, maxAmount: 500 },
      priority: 1,
      steps: {
        create: [
          { stepOrder: 1, approverType: 'MANAGER', requiredApprovalPercent: 100 },
        ],
      },
    },
  });

  const highRule = await prisma.approvalRule.create({
    data: {
      companyId: company.id,
      name: 'High Value - Manager + CFO',
      description: 'Expenses over $500 need manager and CFO approval',
      conditionType: 'AMOUNT_THRESHOLD',
      conditionValue: { minAmount: 500 },
      priority: 2,
      steps: {
        create: [
          { stepOrder: 1, approverType: 'MANAGER', requiredApprovalPercent: 100 },
          { stepOrder: 2, approverType: 'SPECIFIC_USER', approverId: admin.id, requiredApprovalPercent: 100 },
        ],
      },
    },
  });
  console.log('✅ Approval Rules: Low Value, High Value');

  // ─── Policies ─────────────────────────────────────────────
  await prisma.policy.create({
    data: {
      companyId: company.id,
      name: 'Default Expense Policy',
      type: 'EXPENSE_LIMIT',
      rules: {
        maxPerExpense: 5000,
        maxPerMonth: 10000,
        requireReceiptAbove: 50,
      },
      maxExpenseAmount: 5000,
      autoApproveBelow: 25,
      requireReceiptAbove: 50,
    },
  });
  console.log('✅ Default Policy');

  // ─── Budgets ──────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await prisma.budget.create({
    data: {
      companyId: company.id,
      departmentId: engineering.id,
      name: 'Engineering Monthly Budget',
      amount: 10000,
      period: 'MONTHLY',
      startDate: monthStart,
      endDate: monthEnd,
      alertThreshold: 80,
    },
  });

  await prisma.budget.create({
    data: {
      companyId: company.id,
      departmentId: sales.id,
      name: 'Sales Monthly Budget',
      amount: 8000,
      period: 'MONTHLY',
      startDate: monthStart,
      endDate: monthEnd,
      alertThreshold: 90,
    },
  });
  console.log('✅ Budgets: Engineering ($10K), Sales ($8K)');

  // ─── Sample Expenses ──────────────────────────────────────
  const travelCat = categories.find((c) => c.code === 'TRAVEL')!;
  const mealsCat = categories.find((c) => c.code === 'MEALS')!;

  const report = await prisma.expenseReport.create({
    data: {
      companyId: company.id,
      userId: employee.id,
      title: 'March Business Trip',
      description: 'Client visit to San Francisco',
      currency: 'USD',
      companyCurrency: 'USD',
      status: 'DRAFT',
    },
  });

  await prisma.expense.create({
    data: {
      reportId: report.id,
      companyId: company.id,
      userId: employee.id,
      categoryId: travelCat.id,
      description: 'Flight to San Francisco',
      merchant: 'United Airlines',
      amount: 450,
      currency: 'USD',
      convertedAmount: 450,
      companyCurrency: 'USD',
      exchangeRate: 1,
      expenseDate: new Date(),
      status: 'DRAFT',
    },
  });

  await prisma.expense.create({
    data: {
      reportId: report.id,
      companyId: company.id,
      userId: employee.id,
      categoryId: mealsCat.id,
      description: 'Client dinner',
      merchant: 'The Capital Grille',
      amount: 150,
      currency: 'USD',
      convertedAmount: 150,
      companyCurrency: 'USD',
      exchangeRate: 1,
      expenseDate: new Date(),
      status: 'DRAFT',
    },
  });
  console.log('✅ Sample Expense Report with 2 expenses');

  // ─── Notifications ────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: employee.id,
      companyId: company.id,
      type: 'SYSTEM',
      title: 'Welcome to Expense Manager! 🎉',
      message: 'Start tracking your expenses and earning points for cost-efficient spending.',
    },
  });
  console.log('✅ Welcome notification');

  console.log('\n🎉 Seed complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('  Login Credentials (all passwords: Password123!)');
  console.log('─────────────────────────────────────────');
  console.log('  Admin:    admin@acme.com');
  console.log('  Manager:  manager@acme.com');
  console.log('  Employee: employee@acme.com');
  console.log('  Sales:    sales@acme.com');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
