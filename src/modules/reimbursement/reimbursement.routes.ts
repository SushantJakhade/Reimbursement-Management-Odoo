import { Router } from 'express';
import { ReimbursementController } from './reimbursement.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { isAdmin } from '../../shared/middleware/rbac.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { processReimbursementSchema, updateStatusSchema } from './reimbursement.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', ReimbursementController.list);
router.get('/:id', ReimbursementController.get);
router.post('/:id/process', isAdmin, validate(processReimbursementSchema), ReimbursementController.process);
router.put('/:id/status', isAdmin, validate(updateStatusSchema), ReimbursementController.updateStatus);

export default router;
