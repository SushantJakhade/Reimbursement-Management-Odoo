import { Router } from 'express';
import { IntegrationController } from './integration.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { isAdmin } from '../../shared/middleware/rbac.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { createIntegrationSchema, updateIntegrationSchema } from './integration.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', isAdmin, validate(createIntegrationSchema), IntegrationController.create);
router.get('/', isAdmin, IntegrationController.list);
router.get('/:id', isAdmin, IntegrationController.get);
router.put('/:id', isAdmin, validate(updateIntegrationSchema), IntegrationController.update);
router.post('/:id/test', isAdmin, IntegrationController.test);

export default router;
