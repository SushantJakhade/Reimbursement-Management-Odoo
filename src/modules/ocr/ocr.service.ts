import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../config/database';
import { logger } from '../../shared/utils/logger';
import { env } from '../../config/env';
import { NotFoundError, AppError } from '../../shared/middleware/error.middleware';
import path from 'path';
import fs from 'fs';

// Initialize Gemini client conditionally to avoid crashing if empty at boot
const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

export class OcrService {
  /**
   * Process a receipt image through Gemini Vision AI Model
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
      if (!genAI || !env.geminiApiKey) {
        throw new Error('Gemini API key is missing. Please configure GEMINI_API_KEY in .env');
      }

      const filePath = path.resolve(process.cwd(), receipt.fileUrl.replace(/^\//, ''));
      const imageBuffer = await fs.promises.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(filePath);

      // Define the image part for Gemini
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      };

      const prompt = `You are an expert OCR receipt parsing AI. Analyze the image and extract the following details into a valid JSON object.
Schema requirement:
{
  "amount": number | null,
  "currency": string | null (3-letter ISO code, e.g., USD, EUR, INR),
  "merchant": string | null (The store or company name),
  "date": string | null (ISO string format for the transaction date),
  "rawLines": string (Extract all printed text visible on the receipt connected by newlines)
}
If a field cannot be reliably found, return null for it. Do not include markdown formatting like \`\`\`json, just return the raw JSON braces.`;

      // Use Gemini 2.5 Flash for fast multimodal OCR with JSON output enforcing
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });

      const response = await model.generateContent([prompt, imagePart]);
      const responseContent = response.response.text();
      let extracted: any = {};
      
      try {
        extracted = JSON.parse(responseContent);
      } catch (e) {
        logger.error('Failed to parse Gemini output as JSON', { responseContent });
      }

      // Safely parse date
      let parsedDate: Date | null = null;
      if (extracted.date) {
        const d = new Date(extracted.date);
        if (!isNaN(d.getTime())) parsedDate = d;
      }

      // Update OCR result
      const updated = await prisma.ocrResult.update({
        where: { id: ocrResult.id },
        data: {
          rawText: extracted.rawLines || responseContent,
          extractedAmount: extracted.amount || null,
          extractedCurrency: extracted.currency || null,
          extractedMerchant: extracted.merchant || null,
          extractedDate: parsedDate,
          confidence: 98.0, // High confidence heuristic for Gemini Vision
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
      logger.error('OCR AI processing failed', { receiptId, error });

      await prisma.ocrResult.update({
        where: { id: ocrResult.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown AI OCR error',
          processingTime: Date.now() - startTime,
        },
      });

      throw new AppError('OCR AI model processing failed', 500);
    }
  }

  /**
   * Process a raw receipt image directly without DB records (for ad-hoc scanning)
   */
  async scanRaw(file: Express.Multer.File) {
    if (!genAI || !env.geminiApiKey) {
      throw new Error('Gemini API key is missing. Please configure GEMINI_API_KEY in .env');
    }

    const imageBuffer = await fs.promises.readFile(file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this.getMimeType(file.path);

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    const prompt = `You are an expert OCR receipt parsing AI. Analyze the image and extract the following details into a valid JSON object.
Schema requirement:
{
  "amount": number | null,
  "currency": string | null (3-letter ISO code, e.g., USD, EUR, INR),
  "merchant": string | null (The store or company name),
  "date": string | null (ISO string format for the transaction date),
  "rawLines": string (Extract all printed text visible on the receipt connected by newlines)
}
If a field cannot be reliably found, return null for it. Do not include markdown formatting like \`\`\`json, just return the raw JSON braces.`;

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const response = await model.generateContent([prompt, imagePart]);
      const responseContent = response.response.text();
      let extracted: any = {};

      try {
        extracted = JSON.parse(responseContent);
      } catch (e) {
        logger.error('Failed to parse Gemini output as JSON', { responseContent });
      }

      // Safely parse date
      let parsedDate: string | null = null;
      if (extracted.date) {
        const d = new Date(extracted.date);
        if (!isNaN(d.getTime())) parsedDate = d.toISOString();
      }

      // Clean up the temporary uploaded file now that we processed it
      fs.promises.unlink(file.path).catch(console.error);

      return {
        rawText: extracted.rawLines || responseContent,
        extractedAmount: extracted.amount || null,
        extractedCurrency: extracted.currency || null,
        extractedMerchant: extracted.merchant || null,
        extractedDate: parsedDate,
        confidence: 98.0,
        status: 'COMPLETED',
      };
    } catch (error) {
      logger.error('Raw OCR scan failed', error);
      throw new AppError('Raw OCR scanning failed', 500);
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
   * Detect mime type for data URI
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    return 'image/jpeg';
  }

  /**
   * Suggest categories based on merchant name
   */
  private async suggestCategories(ocrResultId: string, merchant: string, companyId: string) {
    const categories = await prisma.expenseCategory.findMany({
      where: { companyId, isActive: true },
    });

    const merchantLower = merchant.toLowerCase();
    const keywordMap: Record<string, string[]> = {
      TRAVEL: ['airline', 'airport', 'flight', 'travel', 'booking', 'uber', 'lyft'],
      MEALS: ['restaurant', 'cafe', 'coffee', 'food', 'pizza', 'burger', 'dine', 'mcdonalds', 'starbucks'],
      TRANSPORT: ['taxi', 'gas', 'fuel', 'parking', 'metro', 'transit', 'shell', 'bp'],
      ACCOMMODATION: ['hotel', 'motel', 'inn', 'airbnb', 'stay', 'lodge', 'marriott', 'hilton'],
      SOFTWARE: ['software', 'saas', 'subscription', 'aws', 'cloud', 'github', 'openai', 'vercel'],
      SUPPLIES: ['office', 'staples', 'supply', 'amazon', 'walmart', 'store'],
      COMMUNICATION: ['phone', 'telecom', 'internet', 'mobile', 'att', 'verizon'],
    };

    const matches: { categoryId: string; confidence: number; matchReason: string }[] = [];

    for (const category of categories) {
      const keywords = keywordMap[category.code] || [];
      for (const keyword of keywords) {
        if (merchantLower.includes(keyword)) {
          matches.push({
            categoryId: category.id,
            confidence: 0.90, // Higher confidence since AI accurately parsed the merchant
            matchReason: `AI-extracted Merchant "${merchant}" matched known keyword "${keyword}"`,
          });
          break; // Avoid duplicate category matches for the same keyword profile
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
