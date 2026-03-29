import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { isAdmin, isAdminOrManager } from '../../shared/middleware/rbac.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from './user.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', isAdmin, validate(createUserSchema), UserController.create);
router.get('/', isAdminOrManager, UserController.list);
router.get('/:id', UserController.get);
router.put('/:id', isAdmin, validate(updateUserSchema), UserController.update);
router.delete('/:id', isAdmin, UserController.delete);
router.get('/:id/points', UserController.getPoints);

export default router;
