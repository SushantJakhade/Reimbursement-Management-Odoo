import Tesseract from 'tesseract.js';
import prisma from '../../config/database';
import { logger } from '../../shared/utils/logger';
import { env } from '../../config/env';
import { NotFoundError, AppError } from '../../shared/middleware/error.middleware';
import path from 'path';

export class OcrService {
  /**
   * Process a receipt image through Tesseract.js OCR
   */
  async processReceipt(receiptId: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { expense: { include: { company: true } } },
    });

    if (!receipt) throw new NotFoundError('Receipt');

    // Create initial OCR result
    const ocrResult = await prisma.ocrResult.create({
      data: {
        receiptId,
        status: 'PROCESSING',
      },
    });

    const startTime = Date.now();

    try {
      // Run Tesseract OCR
      const filePath = path.resolve(receipt.fileUrl.replace(/^\//, ''));
      const result = await Tesseract.recognize(filePath, env.ocrLanguage);
      const rawText = result.data.text;
      const confidence = result.data.confidence;

      // Extract structured data from OCR text
      const extracted = this.extractData(rawText);

      // Update OCR result
      const updated = await prisma.ocrResult.update({
        where: { id: ocrResult.id },
        data: {
          rawText,
          extractedAmount: extracted.amount,
          extractedCurrency: extracted.currency,
          extractedMerchant: extracted.merchant,
          extractedDate: extracted.date,
          confidence,
          processingTime: Date.now() - startTime,
          status: 'COMPLETED',
        },
      });

      // Auto-suggest categories based on merchant
      if (extracted.merchant) {
        await this.suggestCategories(ocrResult.id, extracted.merchant, receipt.expense.companyId);
      }

      return updated;
    } catch (error) {
      logger.error('OCR processing failed', { receiptId, error });

      await prisma.ocrResult.update({
        where: { id: ocrResult.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown OCR error',
          processingTime: Date.now() - startTime,
        },
      });

      throw new AppError('OCR processing failed', 500);
    }
  }

  /**
   * Get OCR result by ID
   */
  async getResult(receiptId: string) {
    const result = await prisma.ocrResult.findUnique({
      where: { receiptId },
      include: { categoryMatches: { include: { category: true } } },
    });
    if (!result) throw new NotFoundError('OCR Result');
    return result;
  }

  /**
   * Batch process multiple receipts
   */
  async batchProcess(receiptIds: string[]) {
    const results = [];
    for (const id of receiptIds) {
      try {
        const result = await this.processReceipt(id);
        results.push({ receiptId: id, status: 'success', result });
      } catch (error) {
        results.push({ receiptId: id, status: 'failed', error: (error as Error).message });
      }
    }
    return results;
  }

  /**
   * Extract structured data from OCR raw text
   */
  private extractData(text: string): {
    amount: number | null;
    currency: string | null;
    merchant: string | null;
    date: Date | null;
  } {
    // Amount extraction — look for patterns like $123.45, 123.45 USD, etc.
    const amountPatterns = [
      /(?:total|amount|due|pay)[:\s]*[\$€£₹]?\s*([\d,]+\.?\d*)/i,
      /[\$€£₹]\s*([\d,]+\.?\d*)/,
      /([\d,]+\.?\d*)\s*(?:USD|EUR|GBP|INR|CAD)/i,
    ];

    let amount: number | null = null;
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Currency extraction
    const currencyMap: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP', '₹': 'INR' };
    let currency: string | null = null;
    const currencyMatch = text.match(/[\$€£₹]/) || text.match(/(USD|EUR|GBP|INR|CAD|AUD)/i);
    if (currencyMatch) {
      currency = currencyMap[currencyMatch[0]] || currencyMatch[0].toUpperCase();
    }

    // Merchant — typically the first meaningful line
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
    const merchant = lines[0] || null;

    // Date extraction
    const datePatterns = [
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
      /(\w+ \d{1,2},?\s*\d{4})/,
    ];
    let date: Date | null = null;
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const parsed = new Date(match[0]);
        if (!isNaN(parsed.getTime())) {
          date = parsed;
          break;
        }
      }
    }

    return { amount, currency, merchant, date };
  }

  /**
   * Suggest categories based on merchant name
   */
  private async suggestCategories(ocrResultId: string, merchant: string, companyId: string) {
    const categories = await prisma.expenseCategory.findMany({
      where: { companyId, isActive: true },
    });

    // Simple keyword matching for category suggestions
    const merchantLower = merchant.toLowerCase();
    const keywordMap: Record<string, string[]> = {
      TRAVEL: ['airline', 'airport', 'flight', 'travel', 'booking'],
      MEALS: ['restaurant', 'cafe', 'coffee', 'food', 'pizza', 'burger', 'dine'],
      TRANSPORT: ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro'],
      ACCOMMODATION: ['hotel', 'motel', 'inn', 'airbnb', 'stay', 'lodge'],
      SOFTWARE: ['software', 'saas', 'subscription', 'aws', 'cloud', 'github'],
      SUPPLIES: ['office', 'staples', 'supply', 'amazon', 'store'],
      COMMUNICATION: ['phone', 'telecom', 'internet', 'mobile'],
    };

    const matches: { categoryId: string; confidence: number; matchReason: string }[] = [];

    for (const category of categories) {
      const keywords = keywordMap[category.code] || [];
      for (const keyword of keywords) {
        if (merchantLower.includes(keyword)) {
          matches.push({
            categoryId: category.id,
            confidence: 0.75,
            matchReason: `Merchant "${merchant}" matches keyword "${keyword}"`,
          });
          break;
        }
      }
    }

    if (matches.length > 0) {
      await prisma.ocrCategoryMatch.createMany({
        data: matches.map((m) => ({ ...m, ocrResultId })),
      });
    }
  }
}
