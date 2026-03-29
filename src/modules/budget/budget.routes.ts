import { Router } from 'express';
import { BudgetController } from './budget.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { isAdmin, isAdminOrManager } from '../../shared/middleware/rbac.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { createBudgetSchema, updateBudgetSchema } from './budget.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', isAdmin, validate(createBudgetSchema), BudgetController.create);
router.get('/', isAdminOrManager, BudgetController.list);
router.get('/:id', BudgetController.get);
router.put('/:id', isAdmin, validate(updateBudgetSchema), BudgetController.update);
router.get('/:id/usage', BudgetController.getUsage);
router.get('/:id/alerts', BudgetController.getAlerts);
router.post('/:id/alerts/:alertId/acknowledge', BudgetController.acknowledgeAlert);

export default router;
