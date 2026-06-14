import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrderById,
  adminGetOrders, adminUpdateOrderStatus,
} from '../controllers/orderController.js';
import { downloadInvoice } from '../controllers/invoiceController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = Router();

// ── Specific static routes MUST come before param routes (:id) ──────────────
router.post('/',
  protect,
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('shippingData.name').notEmpty().withMessage('Shipping name is required'),
    body('shippingData.phone').notEmpty().withMessage('Shipping phone is required'),
    body('shippingData.address').notEmpty().withMessage('Shipping address is required'),
    body('paymentMethod').isIn(['cod', 'bkash', 'sslcommerz']).withMessage('Invalid payment method'),
  ],
  validateRequest,
  createOrder
);
router.get('/my',                        protect,               getMyOrders);
router.get('/admin/all',                 protect, adminOnly,    adminGetOrders);
router.put('/admin/:id/status',          protect, adminOnly,    adminUpdateOrderStatus);
router.get('/:id/invoice',               protect,               downloadInvoice);

// ── Param route last — won't swallow /my or /admin/all anymore ───────────────
router.get('/:id',                       protect,               getOrderById);

export default router;
