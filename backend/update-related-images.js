
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Map product slugs to relevant image keywords
const productKeywords = {
  'samsung-galaxy-s24-ultra': 'smartphone,samsung',
  'iphone-15-pro-max': 'smartphone,iphone,apple',
  'oneplus-12': 'smartphone,oneplus',
  'macbook-air-m3': 'laptop,macbook,apple',
  'dell-xps-15': 'laptop,dell',
  'sony-wh-1000xm5': 'headphones,sony,audio',
  'airpods-pro-2nd-gen': 'earbuds,airpods,apple',
  'premium-cotton-polo-shirt': 'polo-shirt,clothing,men',
  'slim-fit-chino-pants': 'chinos,pants,clothing',
  'floral-maxi-dress': 'dress,women-clothing,floral',
  'nike-air-max-270': 'shoes,sneakers,nike',
  'instant-pot-duo-7-in-1': 'instant-pot,kitchen,appliance',
  'minimalist-desk-lamp-led': 'lamp,desk-lamp,home-office',
  'ergonomic-office-chair': 'office-chair,ergonomic,furniture',
  'adjustable-dumbbell-set': 'dumbbell,gym,fitness',
  'yoga-mat-premium-6mm': 'yoga-mat,fitness,yoga',
  'dri-fit-running-shorts': 'shorts,running,activewear',
  'clean-code-robert-martin': 'book,programming,code',
  'atomic-habits-james-clear': 'book,self-help,habits',
  'the-pragmatic-programmer': 'book,programming,software',
};

async function updateRelatedImages() {
  try {
    // Get all products
    const productsRes = await pool.query('SELECT id, name, slug FROM "Products"');
    const products = productsRes.rows;

    for (const product of products) {
      const keywords = productKeywords[product.slug] || product.name.toLowerCase().replace(/\s+/g, ',');
      // Use picsum with seed based on keywords for consistency
      const seed = keywords.split(',').join('-');
      const imageUrl1 = `https://picsum.photos/seed/${seed}/800/600`;
      const imageUrl2 = `https://picsum.photos/seed/${seed}-2/800/600`;
      
      await pool.query(
        `UPDATE "Products" 
         SET images = $1, thumbnail = $2 
         WHERE id = $3`,
        [[imageUrl1, imageUrl2], imageUrl1, product.id]
      );
      
      console.log(`Updated related images for: ${product.name} (${keywords})`);
    }

    console.log('\n✅ All product images updated with relevant content!');
  } catch (err) {
    console.error('❌ Error updating images:', err);
  } finally {
    await pool.end();
  }
}

updateRelatedImages();
