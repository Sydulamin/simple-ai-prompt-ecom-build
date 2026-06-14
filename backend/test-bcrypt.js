
import bcrypt from 'bcryptjs';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testBcrypt() {
  try {
    // Get admin's password hash
    const res = await pool.query('SELECT password_hash FROM "Users" WHERE email = $1', ['admin@shopwave.com']);
    if (res.rows.length === 0) {
      console.log('Admin not found');
      return;
    }
    const hash = res.rows[0].password_hash;
    console.log('Hash:', hash);
    
    // Test compare
    const testPasswords = ['Admin@1234', 'admin@1234', 'Admin1234', 'password'];
    for (const pwd of testPasswords) {
      const match = await bcrypt.compare(pwd, hash);
      console.log(`Password: "${pwd}" → Match: ${match}`);
    }
    
    // Let's generate a new hash for "Admin@1234"
    const newSalt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash('Admin@1234', newSalt);
    console.log('\nNew hash for "Admin@1234":', newHash);
    const newMatch = await bcrypt.compare('Admin@1234', newHash);
    console.log('New hash match:', newMatch);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

testBcrypt();
