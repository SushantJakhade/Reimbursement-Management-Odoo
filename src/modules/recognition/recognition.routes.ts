import { Router } from 'express';
import { RecognitionController } from './recognition.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/points', RecognitionController.getPoints);
router.get('/leaderboard', RecognitionController.leaderboard);
router.get('/history', RecognitionController.history);

export default router;
