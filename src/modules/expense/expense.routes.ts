import { Router } from 'express';
import { ExpenseController } from './expense.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { createExpenseSchema, updateExpenseSchema } from './expense.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/', validate(createExpenseSchema), ExpenseController.create);
router.get('/', ExpenseController.list);
router.get('/:id', ExpenseController.get);
router.put('/:id', validate(updateExpenseSchema), ExpenseController.update);
router.delete('/:id', ExpenseController.delete);
router.get('/:id/duplicates', ExpenseController.getDuplicates);

export default router;
