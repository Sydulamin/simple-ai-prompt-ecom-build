import { query } from '../config/db.js';

export const CategoryModel = {
  async findAll() {
    const { rows } = await query(
      `SELECT * FROM "Categories" WHERE is_active = true ORDER BY sort_order ASC, name ASC`,
    );
    return rows;
  },

  async findAllWithSubcategories() {
    const { rows: cats } = await query(
      `SELECT * FROM "Categories" WHERE is_active = true ORDER BY sort_order ASC`,
    );
    const { rows: subs } = await query(
      `SELECT * FROM "Subcategories" WHERE is_active = true ORDER BY sort_order ASC`,
    );
    return cats.map((cat) => ({
      ...cat,
      subcategories: subs.filter((s) => s.category_id === cat.id),
    }));
  },

  async findBySlug(slug) {
    const { rows } = await query(
      `SELECT * FROM "Categories" WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT * FROM "Categories" WHERE id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] || null;
  },

  async getSubcategoriesByCategoryId(categoryId) {
    const { rows } = await query(
      `SELECT * FROM "Subcategories"
       WHERE category_id = $1 AND is_active = true
       ORDER BY sort_order ASC`,
      [categoryId],
    );
    return rows;
  },

  async create({ name, slug, description, image_url, sort_order }) {
    const { rows } = await query(
      `INSERT INTO "Categories" (name, slug, description, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, slug, description || null, image_url || null, sort_order || 0],
    );
    return rows[0];
  },

  async createSubcategory({ category_id, name, slug, description, image_url, sort_order }) {
    const { rows } = await query(
      `INSERT INTO "Subcategories" (category_id, name, slug, description, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category_id, name, slug, description || null, image_url || null, sort_order || 0],
    );
    return rows[0];
  },

  async update(id, { name, slug, description, image_url, sort_order, is_active }) {
    const { rows } = await query(
      `UPDATE "Categories"
       SET name = COALESCE($1, name), slug = COALESCE($2, slug),
           description = COALESCE($3, description), image_url = COALESCE($4, image_url),
           sort_order = COALESCE($5, sort_order), is_active = COALESCE($6, is_active)
       WHERE id = $7 RETURNING *`,
      [name, slug, description, image_url, sort_order, is_active, id],
    );
    return rows[0] || null;
  },
};
