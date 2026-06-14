
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool }  = pg;

const DB_URL = 'postgresql://neondb_owner:npg_V6hK0HpDPUEe@ep-purple-flower-aq7823wi-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

const runFile = async (file) => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'migrations', file), 'utf8');
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
        err.code === '42P07' || // duplicate_table
        err.code === '42710' || // duplicate_object
        err.code === '23505'    // unique_violation
      ) {
        // Safe to continue
      } else {
        console.error(`  ✗ Error in statement: ${stmt.slice(0, 80)}`);
        console.error(`    ${err.message}`);
      }
    }
  }
};

(async () => {
  console.log('🗄️  Adding Stock Movements Table...');
  try {
    await runFile('003_stock_movements.sql');
    console.log('✅ Done!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
})();
