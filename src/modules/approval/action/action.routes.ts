import { Router } from 'express';
import { ActionController } from './action.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../../shared/middleware/tenant.middleware';
import { isAdminOrManager } from '../../../shared/middleware/rbac.middleware';
import { validate } from '../../../shared/middleware/validation.middleware';
import { takeActionSchema } from './action.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', isAdminOrManager, validate(takeActionSchema), ActionController.takeAction);
router.get('/history', ActionController.history);

export default router;
