import { query, getClient } from '../config/db.js';
import { ProductModel } from './productModel.js';
import { CouponModel } from './couponModel.js';

const generateOrderNumber = () => {
  const now = new Date();
  const yy  = now.getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${yy}-${rand}`;
};

export const OrderModel = {
  async create({ userId, items, shippingData, paymentMethod, subtotal, shippingCharge, discount, total, couponId }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Verify server-side prices & decrement stock atomically
      for (const item of items) {
        const { rows } = await client.query(
          'SELECT id, price, stock FROM "Products" WHERE id = $1 AND is_active = true FOR UPDATE',
          [item.product_id],
        );

        if (!rows[0]) {
          throw new Error(`Product ${item.product_id} not found or inactive`);
        }
        if (parseFloat(rows[0].price) !== parseFloat(item.unit_price)) {
          throw new Error(`Price mismatch for product ${item.product_id}. Expected ${rows[0].price}.`);
        }
        if (rows[0].stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product_id}`);
        }

        await client.query(
          'UPDATE "Products" SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id],
        );
      }

      // 2. Create order record
      const orderNumber = generateOrderNumber();
      const { rows: orderRows } = await client.query(
        `INSERT INTO "Orders" (
           user_id, order_number, status, payment_status, payment_method,
           subtotal, shipping_charge, discount, total, coupon_id,
           shipping_name, shipping_phone, shipping_address, shipping_city, shipping_zip
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          userId || null, orderNumber, 'pending', 'pending', paymentMethod,
          subtotal, shippingCharge || 0, discount || 0, total, couponId || null,
          shippingData.name, shippingData.phone, shippingData.address,
          shippingData.city, shippingData.zip || null,
        ],
      );
      const order = orderRows[0];

      // 3. Insert order items with product snapshot
      for (const item of items) {
        const { rows: pRows } = await client.query(
          'SELECT name, sku, thumbnail FROM "Products" WHERE id = $1',
          [item.product_id],
        );
        const product = pRows[0];
        await client.query(
          `INSERT INTO "OrderItems"
             (order_id, product_id, product_name, product_sku, thumbnail, quantity, unit_price, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            order.id, item.product_id, product.name, product.sku,
            product.thumbnail, item.quantity, item.unit_price,
            item.quantity * item.unit_price,
          ],
        );
      }

      // 4. Record coupon usage if coupon was applied
      if (couponId && discount > 0) {
        await CouponModel.recordUsage(couponId, userId, order.id, discount, client);
      }

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT o.*, json_agg(
         json_build_object(
           'id', oi.id, 'product_id', oi.product_id,
           'product_name', oi.product_name, 'product_sku', oi.product_sku,
           'thumbnail', oi.thumbnail, 'quantity', oi.quantity,
           'unit_price', oi.unit_price, 'total_price', oi.total_price
         ) ORDER BY oi.id
       ) AS items
       FROM "Orders" o
       LEFT JOIN "OrderItems" oi ON oi.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id],
    );
    return rows[0] || null;
  },

  async findByUser(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { rows } = await query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
              o.total, o.created_at,
              COUNT(oi.id) AS item_count
       FROM "Orders" o
       LEFT JOIN "OrderItems" oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return rows;
  },

  async updateStatus(id, { status, payment_status, gateway_trx_id, gateway_response }) {
    const { rows } = await query(
      `UPDATE "Orders" SET
         status = COALESCE($1, status),
         payment_status = COALESCE($2, payment_status),
         gateway_trx_id = COALESCE($3, gateway_trx_id),
         gateway_response = COALESCE($4, gateway_response)
       WHERE id = $5
       RETURNING *`,
      [status, payment_status, gateway_trx_id, gateway_response ? JSON.stringify(gateway_response) : null, id],
    );
    return rows[0] || null;
  },

  async findByGatewaySession(sessionId) {
    const { rows } = await query(
      `SELECT * FROM "Orders" WHERE gateway_session_id = $1 LIMIT 1`,
      [sessionId],
    );
    return rows[0] || null;
  },

  async findByOrderNumber(orderNumber) {
    const { rows } = await query(
      `SELECT * FROM "Orders" WHERE order_number = $1 LIMIT 1`,
      [orderNumber],
    );
    return rows[0] || null;
  },

  async setGatewaySession(id, sessionId) {
    const { rows } = await query(
      `UPDATE "Orders" SET gateway_session_id = $1 WHERE id = $2 RETURNING id, order_number`,
      [sessionId, id],
    );
    return rows[0] || null;
  },

  async adminList({ page = 1, limit = 20, status, payment_status }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) {
      conditions.push(`o.status = $${idx++}`);
      params.push(status);
    }
    if (payment_status) {
      conditions.push(`o.payment_status = $${idx++}`);
      params.push(payment_status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email,
              COUNT(oi.id) AS item_count
       FROM "Orders" o
       LEFT JOIN "Users" u ON o.user_id = u.id
       LEFT JOIN "OrderItems" oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id, u.name, u.email
       ORDER BY o.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
    );
    return rows;
  },

  async getDashboardMetrics() {
    const { rows } = await query(`
      SELECT
        (SELECT COALESCE(SUM(total), 0) FROM "Orders" WHERE payment_status = 'paid') AS total_revenue,
        (SELECT COUNT(*) FROM "Orders") AS total_orders,
        (SELECT COUNT(*) FROM "Orders" WHERE status IN ('pending','processing')) AS active_orders,
        (SELECT COUNT(*) FROM "Products" WHERE is_active = true AND stock <= low_stock_threshold) AS low_stock_count
    `);
    return rows[0];
  },
};
