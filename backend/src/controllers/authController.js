import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/userModel.js';
import { query } from '../config/db.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Set JWT as HttpOnly cookie AND return it in body for localStorage-based clients
const sendTokenResponse = (res, statusCode, user) => {
  const token = signToken(user.id);

  res.cookie('jwt', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const { password_hash, ...safeUser } = user;
  res.status(statusCode).json({ success: true, token, user: safeUser });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const existing = await UserModel.findByEmail(email);
  if (existing) {
    res.status(409);
    throw new Error('Email is already registered');
  }

  const user = await UserModel.create({ name, email, password, phone });
  sendTokenResponse(res, 201, user);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await UserModel.findByEmail(email);
  if (!user || !user.is_active) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const match = await UserModel.comparePassword(password, user.password_hash);
  if (!match) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  sendTokenResponse(res, 200, user);
});

export const logout = asyncHandler(async (_req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  res.json({ success: true, user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (!name?.trim()) {
    res.status(400);
    throw new Error('Name is required');
  }
  const updated = await UserModel.updateProfile(req.user.id, { name: name.trim(), phone });
  res.json({ success: true, user: updated });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current and new passwords are required');
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters');
  }

  const { rows } = await query(
    'SELECT password_hash FROM "Users" WHERE id = $1',
    [req.user.id],
  );
  if (!rows[0]) {
    res.status(404);
    throw new Error('User not found');
  }

  const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!match) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE "Users" SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

  res.json({ success: true, message: 'Password changed successfully' });
});
