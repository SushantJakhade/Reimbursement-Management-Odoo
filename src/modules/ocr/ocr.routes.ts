import { Router } from 'express';
import { OcrController } from './ocr.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { processOcrSchema, batchOcrSchema } from './ocr.dto';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { env } from '../../config/env';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/process', validate(processOcrSchema), OcrController.process);
router.post('/scan', upload.single('receipt'), OcrController.scanRaw);
router.get('/:id/result', OcrController.getResult);
router.post('/batch', validate(batchOcrSchema), OcrController.batchProcess);

export default router;
