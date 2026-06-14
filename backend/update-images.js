
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function updateImages() {
  try {
    // Get all products
    const productsRes = await pool.query('SELECT id, name FROM "Products"');
    const products = productsRes.rows;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const imageUrl1 = `https://picsum.photos/seed/${product.id}/800/600`;
      const imageUrl2 = `https://picsum.photos/seed/${product.id}-2/800/600`;
      
      await pool.query(
        `UPDATE "Products" 
         SET images = $1, thumbnail = $2 
         WHERE id = $3`,
        [[imageUrl1, imageUrl2], imageUrl1, product.id]
      );
      
      console.log(`Updated images for: ${product.name}`);
    }

    console.log('\n✅ All product images updated successfully!');
  } catch (err) {
    console.error('❌ Error updating images:', err);
  } finally {
    await pool.end();
  }
}

updateImages();
