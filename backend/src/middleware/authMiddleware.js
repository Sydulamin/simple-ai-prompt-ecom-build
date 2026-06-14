import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { asyncHandler } from './errorMiddleware.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Accept Bearer token from Authorization header (localStorage-based frontend)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Fallback: HttpOnly cookie
  else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorised — no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error('Not authorised — invalid or expired token');
  }

  const { rows } = await query(
    'SELECT id, name, email, role, is_active FROM "Users" WHERE id = $1',
    [decoded.id],
  );

  if (!rows[0] || !rows[0].is_active) {
    res.status(401);
    throw new Error('Not authorised — account not found or deactivated');
  }

  req.user = rows[0];
  next();
});

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden — admin access required');
  }
  next();
};
