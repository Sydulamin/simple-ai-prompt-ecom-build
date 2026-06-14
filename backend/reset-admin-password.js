
import bcrypt from 'bcryptjs';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function resetAdminPassword() {
  try {
    const newPassword = 'Admin@1234';
    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);
    
    await pool.query(
      'UPDATE "Users" SET password_hash = $1 WHERE email = $2',
      [newHash, 'admin@shopwave.com']
    );
    
    console.log('✅ Admin password reset successfully!');
    console.log('Email: admin@shopwave.com');
    console.log('New Password: Admin@1234');
    
    // Verify it works
    const verifyRes = await pool.query('SELECT password_hash FROM "Users" WHERE email = $1', ['admin@shopwave.com']);
    const match = await bcrypt.compare(newPassword, verifyRes.rows[0].password_hash);
    console.log('Password verification:', match ? '✅ Passed' : '❌ Failed');
    
  } catch (err) {
    console.error('❌ Error resetting password:', err);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
