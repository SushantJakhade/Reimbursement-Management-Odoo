import { Request, Response } from 'express';
import { OcrService } from './ocr.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse } from '../../shared/utils/response';

const ocrService = new OcrService();

export class OcrController {
  static process = asyncHandler(async (req: Request, res: Response) => {
    const result = await ocrService.processReceipt(req.body.receiptId);
    return successResponse(res, result, 'OCR processing complete');
  });

  static scanRaw = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const result = await ocrService.scanRaw(req.file);
    return successResponse(res, result, 'Raw OCR scan complete');
  });

  static getResult = asyncHandler(async (req: Request, res: Response) => {
    const result = await ocrService.getResult(req.params.id);
    return successResponse(res, result);
  });

  static batchProcess = asyncHandler(async (req: Request, res: Response) => {
    const results = await ocrService.batchProcess(req.body.receiptIds);
    return successResponse(res, results, 'Batch OCR processing complete');
  });
}
