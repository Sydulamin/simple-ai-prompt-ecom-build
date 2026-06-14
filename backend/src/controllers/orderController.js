import { OrderModel } from '../models/orderModel.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingData, paymentMethod, subtotal, shippingCharge, discount, total, couponId } = req.body;

  if (!items?.length || !shippingData || !paymentMethod) {
    res.status(400);
    throw new Error('Items, shipping details, and payment method are required');
  }

  const order = await OrderModel.create({
    userId: req.user?.id || null,
    items, shippingData, paymentMethod,
    subtotal, shippingCharge, discount, total, couponId,
  });

  res.status(201).json({ success: true, order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const orders = await OrderModel.findByUser(
    req.user.id,
    parseInt(page) || 1,
    parseInt(limit) || 10,
  );
  res.json({ success: true, orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await OrderModel.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  // Non-admins can only see their own orders
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    res.status(403);
    throw new Error('Access denied');
  }
  res.json({ success: true, order });
});

export const adminGetOrders = asyncHandler(async (req, res) => {
  const { page, limit, status, payment_status } = req.query;
  const orders = await OrderModel.adminList({
    page: parseInt(page) || 1,
    limit: Math.min(parseInt(limit) || 20, 100),
    status, payment_status,
  });
  res.json({ success: true, orders });
});

export const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { status, payment_status } = req.body;
  const updated = await OrderModel.updateStatus(req.params.id, { status, payment_status });
  if (!updated) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.json({ success: true, order: updated });
});
