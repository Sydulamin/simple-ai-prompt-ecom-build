/**
 * migrate-images-to-webp.js
 *
 * Downloads every external image URL stored in the Products table,
 * converts it to WebP (max 1200px wide, quality 80), saves it locally,
 * and updates the DB row with the new /uploads/products/*.webp path.
 *
 * Safe to re-run — skips rows whose thumbnail already starts with /uploads.
 */

import pg from 'pg';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'products');

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ── helpers ───────────────────────────────────────────────────────────────────

function uniqueFilename() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}.webp`;
}

async function downloadBuffer(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ShopWave-Migrator/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

async function toWebP(buffer, outputPath) {
  await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath);
}

function isExternal(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

// images column is TEXT[] — pg driver returns a JS array
function parseImages(raw) {
  if (Array.isArray(raw)) return raw;
  // fallback: might be stored as a JSON string in some environments
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const { rows: products } = await pool.query(
    `SELECT id, name, thumbnail, images FROM "Products" ORDER BY created_at`
  );

  console.log(`\n📦 Found ${products.length} products\n`);

  let converted = 0, skipped = 0, failed = 0;

  for (const product of products) {
    const imageList = parseImages(product.images);

    // Skip if already migrated
    const needsMigration =
      isExternal(product.thumbnail) || imageList.some(isExternal);

    if (!needsMigration) {
      console.log(`⏭  [${product.name}] — already local, skipping`);
      skipped++;
      continue;
    }

    console.log(`\n▶ [${product.name}]`);

    // Deduplicate all external URLs for this product
    const allUrls = [product.thumbnail, ...imageList].filter(isExternal);
    const unique  = [...new Set(allUrls)];

    // Build url → local-path map
    const urlMap = {};

    for (const url of unique) {
      process.stdout.write(`  ↓ ${url.substring(0, 72)}… `);
      try {
        const buf      = await downloadBuffer(url);
        const filename = uniqueFilename();
        await toWebP(buf, path.join(UPLOAD_DIR, filename));
        urlMap[url] = `/uploads/products/${filename}`;
        console.log('✅');
      } catch (err) {
        console.log(`❌ (${err.message})`);
        urlMap[url] = url; // keep original on failure
        failed++;
      }
    }

    // Remap values — pass plain JS arrays to pg (TEXT[] column)
    const newThumbnail = urlMap[product.thumbnail] ?? product.thumbnail;
    const newImages    = imageList.map((u) => urlMap[u] ?? u);

    await pool.query(
      `UPDATE "Products"
       SET thumbnail = $1,
           images    = ARRAY(SELECT jsonb_array_elements_text($2::jsonb))
       WHERE id = $3`,
      [newThumbnail, JSON.stringify(newImages), product.id]
    );

    converted++;
    console.log(`  ✅ DB updated → ${newThumbnail}`);
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`✅ Converted  : ${converted} products`);
  console.log(`⏭  Skipped    : ${skipped} (already local)`);
  console.log(`❌ URL errors : ${failed}`);
  console.log(`─────────────────────────────────────\n`);

  await pool.end();
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
