import prisma from '../../config/database';
import { NotFoundError } from '../../shared/middleware/error.middleware';

export class AiService {
  /**
   * Auto-categorize an expense based on description/merchant
   */
  async categorize(companyId: string, description: string, merchant?: string) {
    const categories = await prisma.expenseCategory.findMany({
      where: { companyId, isActive: true },
    });

    const text = `${description} ${merchant || ''}`.toLowerCase();

    const keywordMap: Record<string, string[]> = {
      TRAVEL: ['flight', 'airline', 'airport', 'train', 'bus', 'travel', 'trip'],
      MEALS: ['lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'food', 'meal', 'coffee'],
      TRANSPORT: ['uber', 'lyft', 'taxi', 'ride', 'gas', 'fuel', 'parking', 'rental car'],
      ACCOMMODATION: ['hotel', 'motel', 'airbnb', 'stay', 'lodge', 'accommodation'],
      SOFTWARE: ['software', 'license', 'subscription', 'saas', 'cloud', 'hosting'],
      SUPPLIES: ['office', 'supplies', 'stationery', 'desk', 'chair', 'equipment'],
      COMMUNICATION: ['phone', 'internet', 'wifi', 'mobile', 'telecom'],
      TRAINING: ['course', 'training', 'workshop', 'conference', 'seminar', 'book'],
      ENTERTAINMENT: ['entertainment', 'event', 'tickets', 'show', 'team building'],
    };

    const scores: { categoryId: string; name: string; score: number }[] = [];

    for (const category of categories) {
      const keywords = keywordMap[category.code] || [];
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) score += 1;
      }
      if (score > 0) {
        scores.push({ categoryId: category.id, name: category.name, score });
      }
    }

    scores.sort((a, b) => b.score - a.score);

    return {
      suggestions: scores.slice(0, 3).map((s) => ({
        categoryId: s.categoryId,
        categoryName: s.name,
        confidence: Math.min(0.95, s.score * 0.3),
      })),
    };
  }

  /**
   * Detect potential duplicate expenses
   */
  async detectDuplicates(companyId: string, expenseId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, companyId },
    });
    if (!expense) throw new NotFoundError('Expense');

    const dateStart = new Date(expense.expenseDate);
    dateStart.setDate(dateStart.getDate() - 3);
    const dateEnd = new Date(expense.expenseDate);
    dateEnd.setDate(dateEnd.getDate() + 3);

    const potentialDuplicates = await prisma.expense.findMany({
      where: {
        companyId,
        id: { not: expenseId },
        OR: [
          // Same amount + merchant + similar date
          {
            amount: { gte: expense.amount * 0.95, lte: expense.amount * 1.05 },
            merchant: expense.merchant ? { contains: expense.merchant, mode: 'insensitive' } : undefined,
            expenseDate: { gte: dateStart, lte: dateEnd },
          },
          // Exact amount + same date
          {
            amount: expense.amount,
            expenseDate: expense.expenseDate,
          },
        ],
      },
      select: {
        id: true,
        description: true,
        merchant: true,
        amount: true,
        currency: true,
        expenseDate: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return potentialDuplicates.map((dup) => {
      const matchFields: string[] = [];
      if (Math.abs(dup.amount - expense.amount) / expense.amount < 0.05) matchFields.push('amount');
      if (dup.merchant && expense.merchant && dup.merchant.toLowerCase() === expense.merchant.toLowerCase()) matchFields.push('merchant');
      if (dup.expenseDate.toDateString() === expense.expenseDate.toDateString()) matchFields.push('date');

      return {
        ...dup,
        matchFields,
        confidence: matchFields.length / 3,
      };
    });
  }

  /**
   * Get AI suggestions for an expense
   */
  async getSuggestions(companyId: string, expenseId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, companyId },
    });
    if (!expense) throw new NotFoundError('Expense');

    const [categorySuggestions, duplicates] = await Promise.all([
      this.categorize(companyId, expense.description, expense.merchant || undefined),
      this.detectDuplicates(companyId, expenseId),
    ]);

    return {
      categories: categorySuggestions.suggestions,
      duplicates: duplicates.slice(0, 3),
      warnings: duplicates.length > 0 ? ['Potential duplicate expenses detected'] : [],
    };
  }
}
