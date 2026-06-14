
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_V6hK0HpDPUEe@ep-purple-flower-aq7823wi-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

const runFile = async (filePath) => {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      if (
        err.message.includes('already exists') ||
        err.code === '42P07' ||
        err.code === '42710' ||
        err.code === '23505'
      ) {
        // Safe to continue, object already exists
      } else {
        console.error(`❌ Error:`, err.message);
      }
    }
  }
};

(async () => {
  try {
    console.log('🔧 Applying coupon migration...');
    await runFile(path.join(__dirname, '..', 'database', 'migrations', '004_coupons.sql'));
    console.log('✅ Coupons migration applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
})();
