import { Pool } from 'pg';
import { env } from '../config/env';

// Connection pool for Postgres database
export const db = new Pool({
  connectionString: env.SUPABASE_URL,
});

db.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
  process.exit(-1);
});
