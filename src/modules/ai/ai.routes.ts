import { Router } from 'express';
import { AiController } from './ai.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import { categorizeSchema, detectDuplicatesSchema } from './ai.dto';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.post('/categorize', validate(categorizeSchema), AiController.categorize);
router.post('/detect-duplicates', validate(detectDuplicatesSchema), AiController.detectDuplicates);
router.get('/suggestions/:expenseId', AiController.getSuggestions);

export default router;
