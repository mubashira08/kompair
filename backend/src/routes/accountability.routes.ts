import { Router } from 'express';
import { getMyScore } from '../controllers/accountability.controller';

const router = Router();

router.get('/me', getMyScore);

export default router;
