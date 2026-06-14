
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
  // Split on semicolons to run statements individually (handles multi-statement files)
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      // Ignore "already exists" errors so migrations are idempotent
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
  console.log('🗄️  Running migrations on Neon PostgreSQL...\n');

  try {
    console.log('  Running 001_schema.sql...');
    await runFile('001_schema.sql');
    console.log('  ✓ Schema created\n');

    console.log('  Running 002_seed.sql...');
    await runFile('002_seed.sql');
    console.log('  ✓ Seed data inserted\n');

    console.log('✅ All migrations completed successfully!');
    console.log('\nDemo credentials:');
    console.log('  Admin: admin@shopwave.com / Admin@1234');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
