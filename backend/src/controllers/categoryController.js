import { CategoryModel } from '../models/categoryModel.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import redisClient from '../config/redis.js';

const clearCategoryCaches = async () => {
  try {
    const keys = await redisClient.keys('categories:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error('Failed to clear category caches', err);
  }
};

export const getAllCategories = asyncHandler(async (_req, res) => {
  const cacheKey = 'categories:all';
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  } catch (err) {}

  const categories = await CategoryModel.findAllWithSubcategories();
  const response = { success: true, categories };

  try {
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(response)); // 1 hour cache
  } catch (err) {}

  res.json(response);
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const cacheKey = `categories:slug:${req.params.slug}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  } catch (err) {}

  const category = await CategoryModel.findBySlug(req.params.slug);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  const subcategories = await CategoryModel.getSubcategoriesByCategoryId(category.id);
  const response = { success: true, category: { ...category, subcategories } };

  try {
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));
  } catch (err) {}

  res.json(response);
});

export const getSubcategoriesByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const subcategories = await CategoryModel.getSubcategoriesByCategoryId(categoryId);
  res.json({ success: true, subcategories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, sort_order } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const image_url = req.processedImageUrls?.[0] || null;

  const category = await CategoryModel.create({ name, slug, description, image_url, sort_order });
  await clearCategoryCaches();
  res.status(201).json({ success: true, category });
});

export const createSubcategory = asyncHandler(async (req, res) => {
  const { name, description, sort_order } = req.body;
  const { categoryId } = req.params;

  if (!name) {
    res.status(400);
    throw new Error('Subcategory name is required');
  }

  const parent = await CategoryModel.findById(categoryId);
  if (!parent) {
    res.status(404);
    throw new Error('Parent category not found');
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const image_url = req.processedImageUrls?.[0] || null;

  const sub = await CategoryModel.createSubcategory({
    category_id: categoryId, name, slug, description, image_url, sort_order,
  });
  await clearCategoryCaches();
  res.status(201).json({ success: true, subcategory: sub });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await CategoryModel.update(id, req.body);
  if (!updated) {
    res.status(404);
    throw new Error('Category not found');
  }
  await clearCategoryCaches();
  res.json({ success: true, category: updated });
});
