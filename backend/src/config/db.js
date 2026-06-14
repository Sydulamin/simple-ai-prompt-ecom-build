import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

/**
 * Execute a parameterized query against the Neon pool.
 * @param {string} text  - SQL string with $1, $2 placeholders
 * @param {Array}  params - parameter values
 */
export const query = async (text, params = []) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] ${duration}ms — ${text.slice(0, 80)}`);
  }
  return result;
};

/**
 * Acquire a client from the pool for multi-statement transactions.
 */
export const getClient = async () => pool.connect();

export default pool;
