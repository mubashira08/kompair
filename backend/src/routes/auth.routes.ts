import { Router } from 'express';
import { requestOtp, verifyOtp, domainRequest } from '../controllers/auth.controller';

const router = Router();

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/domain-request', domainRequest);

export default router;
