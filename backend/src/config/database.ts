import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });
dotenv.config(); // Also check local environment or backend/.env

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nawi_r76';

const requiresSsl =
  connectionString.includes('supabase') ||
  connectionString.includes('pooler.supabase.com') ||
  connectionString.includes('render.com') ||
  connectionString.includes('sslmode=require') ||
  (process.env.NODE_ENV === 'production' && !connectionString.includes('localhost'));

export const dbPool = new Pool({
  connectionString,
  ssl: requiresSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

dbPool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});
