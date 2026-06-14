import { Router } from 'express';
import {
  bkashCreatePayment,
  bkashExecutePayment,
  sslcommerzInit,
  sslcommerzSuccess,
  sslcommerzFail,
  sslcommerzIPN,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// ── bKash ─────────────────────────────────────────────────────────────────────
router.post('/bkash/create',           protect, bkashCreatePayment);
router.get('/bkash/callback',          bkashExecutePayment);   // browser redirect from bKash

// ── SSLCommerz ────────────────────────────────────────────────────────────────
router.post('/sslcommerz/init',        protect, sslcommerzInit);

// These three are called by SSLCommerz (no auth token) — must be public
router.post('/sslcommerz/success',     sslcommerzSuccess);     // browser POST → validate → redirect to /payment/success
router.post('/sslcommerz/fail',        sslcommerzFail);        // browser POST → redirect to /payment/failed
router.post('/sslcommerz/ipn',         sslcommerzIPN);         // server-to-server silent backup IPN

export default router;
