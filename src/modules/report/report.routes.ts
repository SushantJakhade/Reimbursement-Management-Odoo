import { Router } from 'express';
import { ReportController } from './report.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { createReportSchema, updateReportSchema } from './report.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', validate(createReportSchema), ReportController.create);
router.get('/', ReportController.list);
router.get('/:id', ReportController.get);
router.put('/:id', validate(updateReportSchema), ReportController.update);
router.post('/:id/submit', ReportController.submit);
router.delete('/:id', ReportController.delete);

export default router;
