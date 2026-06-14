
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

console.log('Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

try {
  const res = await pool.query('SELECT NOW()');
  console.log('✅ Connection successful! Current time:', res.rows[0].now);
  
  // Test if tables exist
  const tablesRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log('\n📊 Tables in database:', tablesRes.rows.map(r => r.table_name));
  
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  console.error('Error details:', err);
} finally {
  await pool.end();
}
