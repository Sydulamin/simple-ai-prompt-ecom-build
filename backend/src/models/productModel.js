import { query, getClient } from '../config/db.js';

export const ProductModel = {
  async findAll({ page = 1, limit = 20, category, subcategory, search, sort = 'created_at', order = 'DESC', featured, lowStock = false }) {
    const offset = (page - 1) * limit;
    const conditions = ['p.is_active = true'];
    const params = [];
    let idx = 1;

    if (category) {
      conditions.push(`c.slug = $${idx++}`);
      params.push(category);
    }
    if (subcategory) {
      conditions.push(`sc.slug = $${idx++}`);
      params.push(subcategory);
    }
    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx} OR $${idx} = ANY(p.tags))`);
      params.push(`%${search}%`);
      idx++;
    }
    if (featured === 'true') {
      conditions.push('p.is_featured = true');
    }
    if (lowStock) {
      conditions.push('p.stock <= p.low_stock_threshold');
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowedSorts = ['name', 'price', 'created_at', 'stock'];
    const safeSort  = allowedSorts.includes(sort) ? `p.${sort}` : 'p.created_at';
    const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*) FROM "Products" p
      LEFT JOIN "Categories" c ON p.category_id = c.id
      LEFT JOIN "Subcategories" sc ON p.subcategory_id = sc.id
      ${where}
    `;
    const dataSql = `
      SELECT
        p.id, p.name, p.slug, p.price, p.compare_price, p.sku,
        p.stock, p.thumbnail, p.images, p.tags, p.is_featured, p.is_active,
        p.short_description, p.low_stock_threshold,
        c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
        sc.id AS subcategory_id, sc.name AS subcategory_name, sc.slug AS subcategory_slug
      FROM "Products" p
      LEFT JOIN "Categories" c ON p.category_id = c.id
      LEFT JOIN "Subcategories" sc ON p.subcategory_id = sc.id
      ${where}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countSql, params),
      query(dataSql, [...params, limit, offset]),
    ]);

    return {
      products: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  },

  async findBySlug(slug) {
    const { rows } = await query(
      `SELECT
         p.*,
         c.name AS category_name, c.slug AS category_slug,
         sc.name AS subcategory_name, sc.slug AS subcategory_slug
       FROM "Products" p
       LEFT JOIN "Categories" c ON p.category_id = c.id
       LEFT JOIN "Subcategories" sc ON p.subcategory_id = sc.id
       WHERE p.slug = $1 AND p.is_active = true`,
      [slug],
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT p.*, c.name AS category_name, sc.name AS subcategory_name
       FROM "Products" p
       LEFT JOIN "Categories" c ON p.category_id = c.id
       LEFT JOIN "Subcategories" sc ON p.subcategory_id = sc.id
       WHERE p.id = $1`,
      [id],
    );
    return rows[0] || null;
  },

  async search(term, limit = 8) {
    const { rows } = await query(
      `SELECT id, name, slug, price, thumbnail, category_id
       FROM "Products"
       WHERE is_active = true
         AND (name ILIKE $1 OR $2 = ANY(tags))
       ORDER BY is_featured DESC, name ASC
       LIMIT $3`,
      [`%${term}%`, term.toLowerCase(), limit],
    );
    return rows;
  },

  async create(data) {
    const {
      name, slug, category_id, subcategory_id, description, short_description,
      price, compare_price, cost_price, sku, stock, images, thumbnail,
      tags, is_featured, weight_gram, meta_title, meta_description, low_stock_threshold,
    } = data;

    const { rows } = await query(
      `INSERT INTO "Products" (
         name, slug, category_id, subcategory_id, description, short_description,
         price, compare_price, cost_price, sku, stock, images, thumbnail, tags,
         is_featured, weight_gram, meta_title, meta_description, low_stock_threshold
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
       ) RETURNING *`,
      [
        name, slug, category_id, subcategory_id || null, description, short_description,
        price, compare_price || null, cost_price || null, sku || null, stock || 0,
        images || [], thumbnail || null, tags || [], is_featured || false,
        weight_gram || null, meta_title || null, meta_description || null,
        low_stock_threshold || 5,
      ],
    );
    return rows[0];
  },

  async update(id, data) {
    const {
      name, slug, category_id, subcategory_id, description, short_description,
      price, compare_price, sku, stock, images, thumbnail, tags, is_featured,
      is_active, meta_title, meta_description, low_stock_threshold,
    } = data;

    const { rows } = await query(
      `UPDATE "Products" SET
         name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         category_id = COALESCE($3, category_id),
         subcategory_id = COALESCE($4, subcategory_id),
         description = COALESCE($5, description),
         short_description = COALESCE($6, short_description),
         price = COALESCE($7, price),
         compare_price = COALESCE($8, compare_price),
         sku = COALESCE($9, sku),
         stock = COALESCE($10, stock),
         images = COALESCE($11, images),
         thumbnail = COALESCE($12, thumbnail),
         tags = COALESCE($13, tags),
         is_featured = COALESCE($14, is_featured),
         is_active = COALESCE($15, is_active),
         meta_title = COALESCE($16, meta_title),
         meta_description = COALESCE($17, meta_description),
         low_stock_threshold = COALESCE($18, low_stock_threshold)
       WHERE id = $19
       RETURNING *`,
      [
        name, slug, category_id, subcategory_id, description, short_description,
        price, compare_price, sku, stock, images, thumbnail, tags, is_featured,
        is_active, meta_title, meta_description, low_stock_threshold, id,
      ],
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await query(
      'UPDATE "Products" SET is_active = false WHERE id = $1 RETURNING id',
      [id],
    );
    return rows[0] || null;
  },

  async decrementStock(client, productId, quantity) {
    const { rows } = await client.query(
      `UPDATE "Products" SET stock = stock - $1
       WHERE id = $2 AND stock >= $1
       RETURNING id, stock`,
      [quantity, productId],
    );
    if (!rows[0]) {
      throw new Error(`Insufficient stock for product ${productId}`);
    }
    return rows[0];
  },

  async getLowStock(threshold = 5) {
    const { rows } = await query(
      `SELECT id, name, slug, sku, stock, low_stock_threshold, thumbnail
       FROM "Products"
       WHERE is_active = true AND stock <= low_stock_threshold
       ORDER BY stock ASC
       LIMIT 50`,
    );
    return rows;
  },

  async recordStockMovement(client, { productId, type, quantity, previousStock, newStock, reason, referenceId, createdBy }) {
    const { rows } = await client.query(
      `INSERT INTO "StockMovements" 
         (product_id, type, quantity, previous_stock, new_stock, reason, reference_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [productId, type, quantity, previousStock, newStock, reason, referenceId || null, createdBy || null]
    );
    return rows[0];
  },

  async adjustStock(productId, quantity, reason, userId) {
    // Start a transaction
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get current stock
      const productRes = await client.query('SELECT id, stock FROM "Products" WHERE id = $1', [productId]);
      if (!productRes.rows.length) {
        throw new Error('Product not found');
      }

      const product = productRes.rows[0];
      const previousStock = product.stock;
      const newStock = previousStock + quantity;

      if (newStock < 0) {
        throw new Error('Stock cannot go negative');
      }

      // Update product stock
      await client.query('UPDATE "Products" SET stock = $1 WHERE id = $2', [newStock, productId]);

      // Record movement
      const movementRes = await client.query(
        `INSERT INTO "StockMovements" 
         (product_id, type, quantity, previous_stock, new_stock, reason, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          productId, 
          quantity > 0 ? 'in' : quantity < 0 ? 'out' : 'adjustment', 
          Math.abs(quantity), 
          previousStock, 
          newStock, 
          reason, 
          userId || null,
        ]
      );

      await client.query('COMMIT');
      return movementRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getStockMovements(productId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const [countRes, dataRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM "StockMovements" WHERE product_id = $1`, [productId]),
      query(
        `SELECT sm.*, u.name AS created_by_name 
         FROM "StockMovements" sm
         LEFT JOIN "Users" u ON sm.created_by = u.id
         WHERE sm.product_id = $1
         ORDER BY sm.created_at DESC
         LIMIT $2 OFFSET $3`,
        [productId, limit, offset]
      ),
    ]);

    return {
      movements: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      limit,
      pages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
    };
  },
};
