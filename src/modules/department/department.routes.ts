import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { isAdmin } from '../../shared/middleware/rbac.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { createDepartmentSchema, updateDepartmentSchema } from './department.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', isAdmin, validate(createDepartmentSchema), DepartmentController.create);
router.get('/', DepartmentController.list);
router.get('/:id', DepartmentController.get);
router.put('/:id', isAdmin, validate(updateDepartmentSchema), DepartmentController.update);
router.delete('/:id', isAdmin, DepartmentController.delete);
router.get('/:id/expenses', DepartmentController.getExpenses);

export default router;
