import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
});

/**
 * Sharp WebP pipeline — resize to max 1200px, compress at 80% quality,
 * save to /uploads/products/<timestamp>-<random>.webp on local disk.
 */
export const convertToWebP = async (req, res, next) => {
  try {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return next();

    const processedUrls = [];

    for (const file of files) {
      const filename    = `${Date.now()}-${Math.floor(Math.random() * 100000)}.webp`;
      const outputPath  = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      processedUrls.push(`/uploads/products/${filename}`);
    }

    req.processedImageUrls = processedUrls;
    next();
  } catch (err) {
    next(err);
  }
};
