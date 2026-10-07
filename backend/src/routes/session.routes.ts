import { Router } from 'express';
import { completeSession, recordFocusTimer } from '../controllers/session.controller';

const router = Router();

router.post('/:id/complete', completeSession);
router.post('/focus-timers', recordFocusTimer);

export default router;
