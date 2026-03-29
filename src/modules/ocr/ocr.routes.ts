import { Router } from 'express';
import { OcrController } from './ocr.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { processOcrSchema, batchOcrSchema } from './ocr.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/process', validate(processOcrSchema), OcrController.process);
router.get('/:id/result', OcrController.getResult);
router.post('/batch', validate(batchOcrSchema), OcrController.batchProcess);

export default router;
