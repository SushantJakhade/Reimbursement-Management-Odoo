import { Request, Response } from 'express';
import { ReceiptService } from './receipt.service';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { successResponse, createdResponse } from '../../shared/utils/response';

const receiptService = new ReceiptService();

export class ReceiptController {
  static upload = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const receipt = await receiptService.uploadReceipt(req.body.expenseId, req.file);
    return createdResponse(res, receipt, 'Receipt uploaded successfully');
  });

  static get = asyncHandler(async (req: Request, res: Response) => {
    const receipt = await receiptService.getReceipt(req.params.id);
    return successResponse(res, receipt);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await receiptService.deleteReceipt(req.params.id);
    return successResponse(res, null, 'Receipt deleted');
  });
}
