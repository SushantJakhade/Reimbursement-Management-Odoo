import { Router } from 'express';
import { CompanyController } from './company.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { isAdmin } from '../../shared/middleware/rbac.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { updateCompanySchema } from './company.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', CompanyController.get);
router.put('/', isAdmin, validate(updateCompanySchema), CompanyController.update);
router.get('/stats', CompanyController.stats);

export default router;
