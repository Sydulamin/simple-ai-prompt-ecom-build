
import { CouponModel } from '../models/couponModel.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// Public endpoint to validate a coupon
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code || !subtotal) {
    res.status(400);
    throw new Error('Code and subtotal are required');
  }

  const validation = await CouponModel.validateCoupon(
    code,
    parseFloat(subtotal),
    req.user?.id
  );

  res.json({
    success: validation.valid,
    ...validation,
  });
});

// Admin: Get all coupons
export const getAllCoupons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const is_active = req.query.is_active ? req.query.is_active === 'true' : undefined;

  const data = await CouponModel.findAll({ page, limit, is_active });

  res.json({
    success: true,
    ...data,
  });
});

// Admin: Create coupon
export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await CouponModel.create({
    ...req.body,
    created_by: req.user.id,
  });

  res.json({
    success: true,
    coupon,
  });
});

// Admin: Update coupon
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await CouponModel.update(req.params.id, req.body);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  res.json({
    success: true,
    coupon,
  });
});

// Admin: Delete (deactivate) coupon
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await CouponModel.deactivate(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  res.json({
    success: true,
    coupon,
  });
});
