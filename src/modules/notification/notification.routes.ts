import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { tenantMiddleware } from '../../shared/middleware/tenant.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', NotificationController.list);
router.put('/:id/read', NotificationController.markRead);
router.put('/read-all', NotificationController.markAllRead);
router.get('/unread-count', NotificationController.unreadCount);

export default router;
