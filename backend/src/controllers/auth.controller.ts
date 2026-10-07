import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../services/db.service';
import { sendOtpEmail } from '../services/email.service';
import { generateTokens } from '../utils/jwt.utils';

// Helper to hash OTPs
const hashOtp = (otp: string) => crypto.createHash('sha256').update(otp).digest('hex');

export const requestOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const domain = email.split('@')[1];
    if (!domain) return res.status(400).json({ error: 'Invalid email' });

    // Check allowlist
    const domainCheck = await db.query('SELECT * FROM college_domains WHERE domain = $1 AND is_active = true', [domain]);
    
    if (domainCheck.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Your college isn\'t registered yet',
        requiresDomainRequest: true 
      });
    }

    // Rate limiting check could go here based on IP / Email...

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB
    await db.query(
      `INSERT INTO otp_verifications (email, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)`,
      [email, otpHash, 'login', expiresAt]
    );

    // Send email
    await sendOtpEmail(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const otpHash = hashOtp(otp);

    // Get latest valid OTP for email
    const result = await db.query(
      `SELECT * FROM otp_verifications 
       WHERE email = $1 AND verified_at IS NULL AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const record = result.rows[0];

    // Increment attempts
    if (record.attempts >= 5) {
      return res.status(400).json({ error: 'Too many failed attempts' });
    }

    if (record.otp_hash !== otpHash) {
      await db.query(`UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1`, [record.id]);
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark verified
    await db.query(`UPDATE otp_verifications SET verified_at = now() WHERE id = $1`, [record.id]);

    // Check if user exists
    let userResult = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    let isNewUser = false;
    let userId = '';

    if (userResult.rows.length === 0) {
      // Create user
      isNewUser = true;
      const newUser = await db.query(
        `INSERT INTO users (email, email_verified_at) VALUES ($1, now()) RETURNING id`,
        [email]
      );
      userId = newUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(userId);

    // Hash refresh token for DB
    const refreshTokenHash = hashOtp(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, refreshTokenHash, refreshExpiresAt]
    );

    res.json({ accessToken, refreshToken, isNewUser });
  } catch (error) {
    next(error);
  }
};

export const domainRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, domain, college_name } = req.body;
    if (!email || !domain || !college_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await db.query(
      `INSERT INTO domain_requests (email, domain, college_name) VALUES ($1, $2, $3)`,
      [email, domain, college_name]
    );

    res.json({ message: 'Request submitted successfully' });
  } catch (error) {
    next(error);
  }
};
