import { Router } from 'express';
import { getNotifications, markAsRead, subscribePush } from '../controllers/notification.controller';

const router = Router();

router.get('/', getNotifications);
router.post('/:id/read', markAsRead);
router.post('/subscribe', subscribePush);

export default router;
