import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

export const UserModel = {
  async findByEmail(email) {
    const { rows } = await query(
      'SELECT * FROM "Users" WHERE email = $1 LIMIT 1',
      [email],
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      'SELECT id, name, email, phone, avatar_url, role, is_active, created_at FROM "Users" WHERE id = $1',
      [id],
    );
    return rows[0] || null;
  },

  async create({ name, email, password, phone }) {
    const salt         = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
    const { rows } = await query(
      `INSERT INTO "Users" (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, password_hash, phone || null],
    );
    return rows[0];
  },

  async comparePassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  },

  async updateProfile(id, { name, phone, avatar_url }) {
    const { rows } = await query(
      `UPDATE "Users" SET name = COALESCE($1, name), phone = COALESCE($2, phone),
       avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4
       RETURNING id, name, email, phone, avatar_url, role`,
      [name, phone, avatar_url, id],
    );
    return rows[0];
  },
};
