import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
}

export function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
