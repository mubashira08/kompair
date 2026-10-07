import { Router } from 'express';
import { getMessages, sendMessage, handlePostSession, getActiveChats } from '../controllers/chat.controller';

const router = Router();

router.get('/messages', getMessages);
router.post('/messages', sendMessage);
router.post('/feedback', handlePostSession);
router.get('/active', getActiveChats);

export default router;
