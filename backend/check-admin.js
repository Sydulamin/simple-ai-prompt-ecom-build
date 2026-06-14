
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkAdminUser() {
  try {
    console.log('Checking admin user...');
    const res = await pool.query('SELECT id, name, email, role, password_hash FROM "Users" WHERE email = $1', ['admin@shopwave.com']);
    
    if (res.rows.length === 0) {
      console.log('❌ Admin user not found!');
    } else {
      const admin = res.rows[0];
      console.log('✅ Admin user found:');
      console.log('  ID:', admin.id);
      console.log('  Name:', admin.name);
      console.log('  Email:', admin.email);
      console.log('  Role:', admin.role);
      console.log('  Password Hash:', admin.password_hash.substring(0, 30) + '...');
    }
  } catch (err) {
    console.error('❌ Error checking admin:', err);
  } finally {
    await pool.end();
  }
}

checkAdminUser();
