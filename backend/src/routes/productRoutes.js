import { Router } from 'express';
import {
  getProducts, getProductBySlug, searchProducts,
  createProduct, updateProduct, deleteProduct,
  verifyCartPrices, getProductById,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload, convertToWebP } from '../middleware/uploadMiddleware.js';

const router = Router();

// ── Static routes first ───────────────────────────────────────────────────────
router.get('/',              getProducts);
router.get('/search',        searchProducts);
router.post('/verify-cart',  verifyCartPrices);

// ── Admin ID-based route (before /:slug so /admin/id/:id doesn't conflict) ───
router.get('/admin/id/:id',  protect, adminOnly, getProductById);

// ── Slug-based public detail ──────────────────────────────────────────────────
router.get('/:slug',         getProductBySlug);

// ── Admin mutations ───────────────────────────────────────────────────────────
router.post('/',
  protect, adminOnly,
  upload.array('images', 10),
  convertToWebP,
  createProduct,
);
router.put('/:id',
  protect, adminOnly,
  upload.array('images', 10),
  convertToWebP,
  updateProduct,
);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
