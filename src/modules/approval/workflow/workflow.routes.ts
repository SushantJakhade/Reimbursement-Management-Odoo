import { Router } from 'express';
import { WorkflowController } from './workflow.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../../shared/middleware/tenant.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', WorkflowController.list);
router.get('/pending', WorkflowController.pending);
router.get('/:id', WorkflowController.get);

export default router;
