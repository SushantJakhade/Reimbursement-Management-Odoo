import { Router } from 'express';
import { RuleController } from './rule.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../../shared/middleware/tenant.middleware';
import { isAdmin } from '../../../shared/middleware/rbac.middleware';
import { validate } from '../../../shared/middleware/validation.middleware';
import { createRuleSchema, updateRuleSchema, addStepSchema } from './rule.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', isAdmin, validate(createRuleSchema), RuleController.create);
router.get('/', RuleController.list);
router.get('/:id', RuleController.get);
router.put('/:id', isAdmin, validate(updateRuleSchema), RuleController.update);
router.post('/:id/steps', isAdmin, validate(addStepSchema), RuleController.addStep);
router.put('/:id/steps/:stepId', isAdmin, RuleController.updateStep);
router.delete('/:id/steps/:stepId', isAdmin, RuleController.deleteStep);

export default router;
