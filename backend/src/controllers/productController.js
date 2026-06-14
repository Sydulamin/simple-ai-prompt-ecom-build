import { ProductModel } from '../models/productModel.js';
import { query } from '../config/db.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import redisClient from '../config/redis.js';

// Cache invalidation helper
const clearProductCaches = async () => {
  try {
    const keys = await redisClient.keys('products:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error('Failed to clear product caches', err);
  }
};

// Build a unique slug — appends -2, -3 … if slug already exists
const buildUniqueSlug = async (base, excludeId = null) => {
  const sanitized = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let slug  = sanitized;
  let count = 1;

  while (true) {
    const { rows } = await query(
      `SELECT id FROM "Products" WHERE slug = $1${excludeId ? ' AND id != $2' : ''} LIMIT 1`,
      excludeId ? [slug, excludeId] : [slug],
    );
    if (!rows.length) return slug;
    count += 1;
    slug = `${sanitized}-${count}`;
  }
};

export const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, category, subcategory, search, sort, order, featured } = req.query;
  
  const cacheKey = `products:list:${JSON.stringify(req.query)}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  } catch (err) {}

  const result = await ProductModel.findAll({
    page:  parseInt(page)  || 1,
    limit: Math.min(parseInt(limit) || 20, 100),
    category, subcategory, search, sort, order, featured,
  });

  const response = { success: true, ...result };
  try {
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response)); // 5 min cache
  } catch (err) {}

  res.json(response);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const cacheKey = `products:slug:${req.params.slug}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  } catch (err) {}

  const product = await ProductModel.findBySlug(req.params.slug);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const response = { success: true, product };
  try {
    await redisClient.setEx(cacheKey, 600, JSON.stringify(response)); // 10 min cache
  } catch (err) {}

  res.json(response);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await ProductModel.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ success: true, products: [] });
  }

  const cacheKey = `products:search:${q.trim()}:${limit || 8}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  } catch (err) {}

  const products = await ProductModel.search(q.trim(), parseInt(limit) || 8);
  const response = { success: true, products };

  try {
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
  } catch (err) {}

  res.json(response);
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  if (req.processedImageUrls?.length) {
    data.images    = req.processedImageUrls;
    data.thumbnail = req.processedImageUrls[0];
  }

  // Build collision-safe slug
  const slugBase = data.slug || data.name || `product-${Date.now()}`;
  data.slug = await buildUniqueSlug(slugBase);

  if (typeof data.tags === 'string') {
    data.tags = data.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  }
  if (typeof data.is_featured === 'string') {
    data.is_featured = data.is_featured === 'true';
  }

  const product = await ProductModel.create(data);
  await clearProductCaches();
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data   = { ...req.body };

  if (req.processedImageUrls?.length) {
    data.images    = req.processedImageUrls;
    data.thumbnail = req.processedImageUrls[0];
  }

  // If name changed but slug not explicitly provided, regenerate slug
  if (data.name && !data.slug) {
    data.slug = await buildUniqueSlug(data.name, id);
  } else if (data.slug) {
    data.slug = await buildUniqueSlug(data.slug, id);
  }

  if (typeof data.tags === 'string') {
    data.tags = data.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  }
  if (typeof data.is_featured === 'string') {
    data.is_featured = data.is_featured === 'true';
  }
  if (typeof data.is_active === 'string') {
    data.is_active = data.is_active === 'true';
  }

  const product = await ProductModel.update(id, data);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await clearProductCaches();
  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const deleted = await ProductModel.delete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error('Product not found');
  }
  await clearProductCaches();
  res.json({ success: true, message: 'Product deactivated successfully' });
});

export const verifyCartPrices = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || !items.length) {
    res.status(400);
    throw new Error('Cart items are required');
  }

  const verified = [];
  let tampered = false;

  for (const item of items) {
    const product = await ProductModel.findById(item.product_id);
    if (!product || !product.is_active) {
      res.status(404);
      throw new Error(`Product not found or no longer available`);
    }
    const serverPrice = parseFloat(product.price);
    const clientPrice = parseFloat(item.unit_price);

    if (serverPrice !== clientPrice) tampered = true;

    verified.push({
      product_id:  product.id,
      name:        product.name,
      thumbnail:   product.thumbnail,
      quantity:    item.quantity,
      unit_price:  serverPrice,
      total_price: serverPrice * item.quantity,
      in_stock:    product.stock >= item.quantity,
    });
  }

  res.json({ success: true, tampered, items: verified });
});
