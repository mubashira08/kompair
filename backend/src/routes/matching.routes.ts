import { Router } from 'express';
import { getPool, createMatchRequest, acceptMatchRequest, declineMatchRequest, getPendingRequests } from '../controllers/matching.controller';

const router = Router();

router.get('/pool', getPool);
router.post('/', createMatchRequest);
router.get('/pending', getPendingRequests);
router.post('/:id/accept', acceptMatchRequest);
router.post('/:id/decline', declineMatchRequest);

export default router;
