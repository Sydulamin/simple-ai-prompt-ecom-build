import { OrderModel } from '../models/orderModel.js';
import { ProductModel } from '../models/productModel.js';
import { query } from '../config/db.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getDashboardMetrics = asyncHandler(async (_req, res) => {
  const [metrics, lowStock, recentOrders] = await Promise.all([
    OrderModel.getDashboardMetrics(),
    ProductModel.getLowStock(),
    query(`
      SELECT o.id, o.order_number, o.total, o.status, o.payment_status,
             o.payment_method, o.created_at, o.shipping_name
      FROM "Orders" o
      ORDER BY o.created_at DESC
      LIMIT 10
    `),
  ]);

  res.json({
    success: true,
    metrics: {
      total_revenue:   parseFloat(metrics.total_revenue)   || 0,
      total_orders:    parseInt(metrics.total_orders)     || 0,
      active_orders:   parseInt(metrics.active_orders)    || 0,
      low_stock_count: parseInt(metrics.low_stock_count)  || 0,
    },
    low_stock_products: lowStock,
    recent_orders: recentOrders.rows,
  });
});

export const getRevenueChart = asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    SELECT
      TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
      COALESCE(SUM(total), 0)::float AS revenue,
      COUNT(*)::int                  AS orders
    FROM "Orders"
    WHERE payment_status = 'paid'
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
    ORDER BY 1 ASC
  `);

  res.json({
    success: true,
    chart: rows.map((r) => ({
      day:     r.day,
      revenue: parseFloat(r.revenue) || 0,
      orders:  parseInt(r.orders)    || 0,
    })),
  });
});

export const getInventoryOverview = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search;
  const lowStock = req.query.lowStock === 'true';
  const sort = req.query.sort || 'stock';
  const order = req.query.order || 'ASC';

  const data = await ProductModel.findAll({
    page,
    limit,
    search,
    lowStock,
    sort,
    order,
    featured: undefined, // clear featured filter for inventory overview
  });

  res.json({
    success: true,
    ...data,
  });
});

export const adjustProductStock = asyncHandler(async (req, res) => {
  const { productId, quantity, reason } = req.body;

  if (!productId || quantity === undefined || !reason) {
    res.status(400);
    throw new Error('Product ID, quantity, and reason are required');
  }

  const movement = await ProductModel.adjustStock(
    productId,
    parseInt(quantity),
    reason,
    req.user.id
  );

  res.json({
    success: true,
    movement,
  });
});

export const getProductStockMovements = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const data = await ProductModel.getStockMovements(productId, { page, limit });

  res.json({
    success: true,
    ...data,
  });
});
