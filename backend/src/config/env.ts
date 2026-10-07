import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecret',
};
