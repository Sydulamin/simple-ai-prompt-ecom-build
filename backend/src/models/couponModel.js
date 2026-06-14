
import { query, getClient } from '../config/db.js';

export const CouponModel = {
  async create(data) {
    const {
      code, type, value, min_order_value, max_discount,
      usage_limit, usage_limit_per_user, expires_at,
      description, created_by
    } = data;

    // Normalize inputs: empty strings → null, convert strings to numbers
    const normalize = (val) => val === '' || val === null || val === undefined ? null : val;
    const toNum = (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    };

    const { rows } = await query(
      `INSERT INTO "Coupons" (
         code, type, value, min_order_value, max_discount,
         usage_limit, usage_limit_per_user, expires_at, description, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        code.toUpperCase(),
        type,
        parseFloat(value) || 0,
        parseFloat(min_order_value) || 0,
        toNum(max_discount),
        toNum(usage_limit),
        toNum(usage_limit_per_user),
        normalize(expires_at),
        normalize(description),
        created_by || null
      ],
    );
    return rows[0];
  },

  async update(id, data) {
    const {
      code, type, value, min_order_value, max_discount,
      usage_limit, usage_limit_per_user, expires_at,
      description, is_active
    } = data;

    // Normalize inputs
    const normalize = (val) => val === '' || val === null || val === undefined ? null : val;
    const toNum = (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    };

    const { rows } = await query(
      `UPDATE "Coupons" SET
         code = COALESCE($1, code),
         type = COALESCE($2, type),
         value = COALESCE($3, value),
         min_order_value = COALESCE($4, min_order_value),
         max_discount = $5,
         usage_limit = $6,
         usage_limit_per_user = $7,
         expires_at = $8,
         description = COALESCE($9, description),
         is_active = COALESCE($10, is_active)
       WHERE id = $11
       RETURNING *`,
      [
        code ? code.toUpperCase() : null,
        type,
        value !== undefined ? parseFloat(value) : null,
        min_order_value !== undefined ? parseFloat(min_order_value) : null,
        toNum(max_discount),
        toNum(usage_limit),
        toNum(usage_limit_per_user),
        normalize(expires_at),
        normalize(description),
        is_active !== undefined ? is_active : null,
        id
      ],
    );
    return rows[0] || null;
  },

  async findAll({ page = 1, limit = 20, is_active }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (is_active !== undefined) {
      conditions.push(`is_active = $${idx++}`);
      params.push(is_active);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM "Coupons" ${where}`, params),
      query(
        `SELECT 
           c.*,
           (SELECT COUNT(*) FROM "CouponUsages" WHERE coupon_id = c.id) AS usage_count
         FROM "Coupons" c
         ${where}
         ORDER BY c.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset],
      ),
    ]);

    return {
      coupons: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      limit,
      pages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
    };
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM "Coupons" WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async findByCode(code) {
    const { rows } = await query(`SELECT * FROM "Coupons" WHERE code = $1`, [code.toUpperCase()]);
    return rows[0] || null;
  },

  async deactivate(id) {
    const { rows } = await query(`UPDATE "Coupons" SET is_active = false WHERE id = $1 RETURNING *`, [id]);
    return rows[0] || null;
  },

  async validateCoupon(code, orderSubtotal, userId = null) {
    const coupon = await this.findByCode(code);
    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    if (!coupon.is_active) {
      return { valid: false, error: 'Coupon is not active' };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, error: 'Coupon has expired' };
    }

    if (parseFloat(orderSubtotal) < parseFloat(coupon.min_order_value)) {
      return {
        valid: false,
        error: `Minimum order value for this coupon is ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'BDT' }).format(coupon.min_order_value)}`
      };
    }

    const totalUsageRes = await query(`SELECT COUNT(*) FROM "CouponUsages" WHERE coupon_id = $1`, [coupon.id]);
    if (coupon.usage_limit && parseInt(totalUsageRes.rows[0].count) >= coupon.usage_limit) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    if (userId && coupon.usage_limit_per_user) {
      const userUsageRes = await query(
        `SELECT COUNT(*) FROM "CouponUsages" WHERE coupon_id = $1 AND user_id = $2`,
        [coupon.id, userId],
      );
      if (parseInt(userUsageRes.rows[0].count) >= coupon.usage_limit_per_user) {
        return { valid: false, error: 'Coupon usage limit per user reached' };
      }
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderSubtotal * coupon.value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }

    if (discount > orderSubtotal) {
      discount = orderSubtotal;
    }

    return {
      valid: true,
      coupon,
      discount: parseFloat(discount),
      message: 'Coupon applied successfully'
    };
  },

  async recordUsage(couponId, userId, orderId, discountApplied, client = null) {
    const queryFn = client ? client.query.bind(client) : query;
    const { rows } = await queryFn(
      `INSERT INTO "CouponUsages"
         (coupon_id, user_id, order_id, discount_applied)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [couponId, userId || null, orderId, discountApplied],
    );
    return rows[0];
  },
};
