import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register, login, logout, getMe, updateProfile, changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware.js';

const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000, // 15 minutes
  max:            20,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { success: false, message: 'Too many attempts, please try again later.' },
});

const router = Router();

router.post('/register',  
  authLimiter, 
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validateRequest,
  register
);

router.post('/login',     
  authLimiter, 
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login
);
router.post('/logout',    logout);
router.get('/me',         protect, getMe);
router.put('/profile',    protect, updateProfile);
router.put('/password',   protect, changePassword);

export default router;
