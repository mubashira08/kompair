import { Router } from 'express';
import { updateActiveStatus } from '../controllers/user.controller';

const router = Router();

router.patch('/me/active', updateActiveStatus);

export default router;
