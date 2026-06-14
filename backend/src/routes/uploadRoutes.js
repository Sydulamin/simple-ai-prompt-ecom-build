import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload, convertToWebP } from '../middleware/uploadMiddleware.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

const router = Router();

router.post(
  '/images',
  protect,
  adminOnly,
  upload.array('images', 10),
  convertToWebP,
  asyncHandler(async (req, res) => {
    if (!req.processedImageUrls?.length) {
      res.status(400);
      throw new Error('No images uploaded');
    }
    res.json({ success: true, urls: req.processedImageUrls });
  }),
);

export default router;
