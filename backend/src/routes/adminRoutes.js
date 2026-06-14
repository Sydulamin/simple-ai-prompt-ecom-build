import { Router } from 'express';
import {
  getDashboardMetrics,
  getRevenueChart,
  getInventoryOverview,
  adjustProductStock,
  getProductStockMovements,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboardMetrics);
router.get('/revenue-chart', getRevenueChart);

// Inventory routes
router.get('/inventory', getInventoryOverview);
router.post('/inventory/adjust', adjustProductStock);
router.get('/inventory/:productId/movements', getProductStockMovements);

export default router;
