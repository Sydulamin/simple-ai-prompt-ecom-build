import { Router } from 'express';
import {
  getAllCategories, getCategoryBySlug, getSubcategoriesByCategory,
  createCategory, createSubcategory, updateCategory,
} from '../controllers/categoryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload, convertToWebP } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/',                                        getAllCategories);
router.get('/:slug',                                   getCategoryBySlug);
router.get('/:categoryId/subcategories',               getSubcategoriesByCategory);

router.post('/', protect, adminOnly,
  upload.single('image'), convertToWebP, createCategory);

router.post('/:categoryId/subcategories', protect, adminOnly,
  upload.single('image'), convertToWebP, createSubcategory);

router.put('/:id', protect, adminOnly, updateCategory);

export default router;
