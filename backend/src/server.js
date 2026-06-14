import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import couponRoutes from './routes/couponRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global Rate Limiting
const isDev = process.env.NODE_ENV === 'development';
const globalLimiter = rateLimit({
  windowMs: isDev ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 mins dev, 15 mins prod
  max: isDev ? 1000 : 100, // 1000 requests dev, 100 prod
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => process.env.DISABLE_RATE_LIMIT === 'true', // Optional disable
});
if (process.env.DISABLE_RATE_LIMIT !== 'true') {
  app.use('/api', globalLimiter);
}

// ── Static Files (WebP images served from /uploads) ──────────────────────────
// Images are content-addressed (timestamp-random filename) so they never
// change once written — safe to cache for a long time.
const ONE_YEAR = 365 * 24 * 60 * 60; // seconds
app.use(
  '/uploads',
  (req, res, next) => {
    // Only aggressively cache immutable product images
    if (/\.(webp|jpg|jpeg|png|gif|avif|svg)$/i.test(req.path)) {
      res.set({
        'Cache-Control': `public, max-age=${ONE_YEAR}, immutable`,
        'Vary': 'Accept-Encoding',
      });
    }
    next();
  },
  express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: `${ONE_YEAR}s`,
    etag: true,
    lastModified: true,
  }),
);

// ── API Routes ────────────────────────────────────────────────────────────────
// Add cache headers for public read-only API endpoints
app.use('/api/products', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
  next();
});
app.use('/api/categories', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  }
  next();
});

app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/payment',    paymentRoutes);
app.use('/api/coupons',    couponRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 & Global Error Handler ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 ShopWave API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

export default app;
