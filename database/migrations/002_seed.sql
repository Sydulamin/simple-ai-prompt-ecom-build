-- ============================================================
-- Seed Data - Categories, Subcategories, Products, Admin User
-- ============================================================

-- Admin user (password: Admin@1234 - bcrypt hash)
INSERT INTO "Users" (name, email, password_hash, phone, role) VALUES
('Admin User', 'admin@shopwave.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMNJges5TLKKs4bRm5hPaxTbJe', '01711000000', 'admin');

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO "Categories" (id, name, slug, description, sort_order) VALUES
('a1000000-0000-0000-0000-000000000001', 'Electronics',      'electronics',      'Gadgets, devices, and accessories',   1),
('a1000000-0000-0000-0000-000000000002', 'Fashion',          'fashion',          'Clothing, footwear, and accessories', 2),
('a1000000-0000-0000-0000-000000000003', 'Home & Living',    'home-living',      'Furniture, decor, and kitchenware',   3),
('a1000000-0000-0000-0000-000000000004', 'Sports & Fitness', 'sports-fitness',   'Equipment and activewear',            4),
('a1000000-0000-0000-0000-000000000005', 'Books',            'books',            'Fiction, non-fiction, and education', 5);

-- ============================================================
-- SUBCATEGORIES
-- ============================================================
INSERT INTO "Subcategories" (id, category_id, name, slug, sort_order) VALUES
-- Electronics
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Smartphones',     'smartphones',      1),
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Laptops',         'laptops',          2),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Audio',           'audio',            3),
('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Accessories',     'electronics-acc',  4),
-- Fashion
('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Men''s Clothing', 'mens-clothing',    1),
('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'Women''s Clothing','womens-clothing', 2),
('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', 'Footwear',        'footwear',         3),
-- Home & Living
('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003', 'Furniture',       'furniture',        1),
('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000003', 'Kitchen',         'kitchen',          2),
('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000003', 'Decor',           'decor',            3),
-- Sports
('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000004', 'Gym Equipment',   'gym-equipment',    1),
('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000004', 'Activewear',      'activewear',       2),
-- Books
('b1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000005', 'Fiction',         'fiction',          1),
('b1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000005', 'Technology',      'tech-books',       2);

-- ============================================================
-- PRODUCTS (20 seeded products)
-- ============================================================
INSERT INTO "Products" (name, slug, category_id, subcategory_id, description, short_description, price, compare_price, sku, stock, images, thumbnail, tags, is_featured) VALUES

-- Electronics - Smartphones
('Samsung Galaxy S24 Ultra',
 'samsung-galaxy-s24-ultra',
 'a1000000-0000-0000-0000-000000000001',
 'b1000000-0000-0000-0000-000000000001',
 'The Samsung Galaxy S24 Ultra features a 6.8-inch QHD+ Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 processor, 200MP quad-camera system, and a built-in S Pen. Designed for professionals who demand peak performance.',
 '6.8" QHD+ | Snapdragon 8 Gen 3 | 200MP Camera | S Pen',
 134999, 149999, 'SKU-SM-S24U', 45,
 ARRAY['/uploads/products/samsung-s24-ultra-1.webp', '/uploads/products/samsung-s24-ultra-2.webp'],
 '/uploads/products/samsung-s24-ultra-1.webp',
 ARRAY['smartphone', 'samsung', 'android', '5g', 's-pen', 'flagship'], true),

('iPhone 15 Pro Max',
 'iphone-15-pro-max',
 'a1000000-0000-0000-0000-000000000001',
 'b1000000-0000-0000-0000-000000000001',
 'iPhone 15 Pro Max with A17 Pro chip, titanium design, 48MP main camera with 5x optical zoom, and USB-C connectivity. Experience the most advanced iPhone ever made.',
 'A17 Pro | Titanium | 48MP | 5x Zoom | USB-C',
 164999, 179999, 'SKU-IP-15PM', 30,
 ARRAY['/uploads/products/iphone-15pm-1.webp', '/uploads/products/iphone-15pm-2.webp'],
 '/uploads/products/iphone-15pm-1.webp',
 ARRAY['smartphone', 'apple', 'iphone', 'ios', '5g', 'flagship'], true),

('OnePlus 12',
 'oneplus-12',
 'a1000000-0000-0000-0000-000000000001',
 'b1000000-0000-0000-0000-000000000001',
 'OnePlus 12 with Snapdragon 8 Gen 3, Hasselblad camera system, 5400mAh battery with 100W SUPERVOOC charging. Speed meets elegance.',
 'Snapdragon 8 Gen 3 | Hasselblad | 100W Charging',
 79999, 89999, 'SKU-OP-12', 60,
 ARRAY['/uploads/products/oneplus12-1.webp'],
 '/uploads/products/oneplus12-1.webp',
 ARRAY['smartphone', 'oneplus', 'android', '5g'], false),

-- Electronics - Laptops
('MacBook Air M3',
 'macbook-air-m3',
 'a1000000-0000-0000-0000-000000000001',
 'b1000000-0000-0000-0000-000000000002',
 'The MacBook Air with M3 chip delivers exceptional performance in an incredibly thin and light design. With up to 18 hours battery life, Liquid Retina display, and all-day portability.',
 'M3 Chip | 15" Liquid Retina | 18h Battery | 8GB RAM',
 149999, 164999, 'SKU-MBA-M3', 25,
 ARRAY['/uploads/products/macbook-air-m3-1.webp', '/uploads/products/macbook-air-m3-2.webp'],
 '/uploads/products/macbook-air-m3-1.webp',
 ARRAY['laptop', 'apple', 'macbook', 'macos', 'ultrabook'], true),

('Dell XPS 15',
 'dell-xps-15',
 'a1000000-0000-0000-0000-000000000001',
 'b1000000-0000-0000-0000-000000000002',
 'Dell XPS 15 with Intel Core i9-13900H, NVIDIA RTX 4070, 32GB DDR5 RAM, 15.6" OLED touch display. The ultimate powerhouse for creators and developers.',
 'i9-13900H | RTX 4070 | 32GB DDR5 | 15.6" OLED',
 189999, 209999, 'SKU-DELL-XPS15', 18,
 ARRAY['/uploads/products/dell-xps15-1.webp'],
 '/uploads/products/dell-xps15-1.webp',
 ARRAY['laptop', 'dell', 'windows', 'gaming', 'creator'], false),

-- Electronics - Audio
('Sony WH-1000XM5',
 'sony-wh-1000xm5',
 'a1000000-0000-0000-0000-000000000001',
 'b1000000-0000-0000-0000-000000000003',
 'Industry-leading noise canceling headphones with 30-hour battery life, multipoint connection, crystal-clear hands-free calling, and exceptional sound quality powered by HD Noise Canceling Processor QN1.',
 'Industry ANC | 30h Battery | LDAC | Multipoint',
 34999, 39999, 'SKU-SONY-XM5', 80,
 ARRAY['/uploads/products/sony-xm5-1.webp', '/uploads/products/sony-xm5-2.webp'],
 '/uploads/products/sony-xm5-1.webp',
 ARRAY['headphones', 'sony', 'anc', 'wireless', 'audio'], true),

('AirPods Pro 2nd Gen',
 'airpods-pro-2nd-gen',
 'a1000000-0000-0000-0000-000000000001',
 'b1000000-0000-0000-0000-000000000003',
 'AirPods Pro (2nd generation) with H2 chip delivers up to 2x more Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio with dynamic head tracking.',
 'H2 Chip | 2x ANC | Spatial Audio | MagSafe',
 29999, 32999, 'SKU-APP-2', 100,
 ARRAY['/uploads/products/airpods-pro2-1.webp'],
 '/uploads/products/airpods-pro2-1.webp',
 ARRAY['earbuds', 'apple', 'anc', 'wireless', 'audio'], false),

-- Fashion - Men's Clothing
('Premium Cotton Polo Shirt',
 'premium-cotton-polo-shirt',
 'a1000000-0000-0000-0000-000000000002',
 'b1000000-0000-0000-0000-000000000005',
 '100% Pima cotton premium polo shirt with ribbed collar and cuffs, two-button placket, and moisture-wicking finish. Available in 8 classic colors. Machine washable.',
 '100% Pima Cotton | Moisture-Wicking | 8 Colors',
 1899, 2499, 'SKU-POLO-M-001', 200,
 ARRAY['/uploads/products/polo-shirt-1.webp', '/uploads/products/polo-shirt-2.webp'],
 '/uploads/products/polo-shirt-1.webp',
 ARRAY['polo', 'shirt', 'mens', 'cotton', 'casual'], false),

('Slim Fit Chino Pants',
 'slim-fit-chino-pants',
 'a1000000-0000-0000-0000-000000000002',
 'b1000000-0000-0000-0000-000000000005',
 'Stretch slim-fit chino pants crafted from premium cotton-spandex blend. Features four pockets, zip fly, and a clean tapered silhouette perfect for office or casual wear.',
 'Stretch Cotton | Slim Fit | 4 Pockets | Office-Casual',
 2799, 3499, 'SKU-CHINO-001', 150,
 ARRAY['/uploads/products/chino-pants-1.webp'],
 '/uploads/products/chino-pants-1.webp',
 ARRAY['pants', 'chino', 'mens', 'slim-fit', 'office'], false),

-- Fashion - Women's Clothing
('Floral Maxi Dress',
 'floral-maxi-dress',
 'a1000000-0000-0000-0000-000000000002',
 'b1000000-0000-0000-0000-000000000006',
 'Elegant floral print maxi dress with adjustable straps, flowing silhouette, and soft viscose fabric. Perfect for summer occasions, beach outings, or casual evenings.',
 'Viscose | Adjustable Straps | Floral Print | Summer',
 3299, 4199, 'SKU-DRESS-F001', 120,
 ARRAY['/uploads/products/maxi-dress-1.webp', '/uploads/products/maxi-dress-2.webp'],
 '/uploads/products/maxi-dress-1.webp',
 ARRAY['dress', 'maxi', 'womens', 'floral', 'summer'], true),

-- Fashion - Footwear
('Nike Air Max 270',
 'nike-air-max-270',
 'a1000000-0000-0000-0000-000000000002',
 'b1000000-0000-0000-0000-000000000007',
 'Nike Air Max 270 with the largest Air unit in the heel for all-day comfort. Features an engineered mesh upper for breathability and a foam midsole for lightweight cushioning.',
 'Air Max 270 Unit | Mesh Upper | Lightweight Foam',
 13999, 15999, 'SKU-NK-AM270', 75,
 ARRAY['/uploads/products/nike-am270-1.webp', '/uploads/products/nike-am270-2.webp'],
 '/uploads/products/nike-am270-1.webp',
 ARRAY['shoes', 'nike', 'sneakers', 'air-max', 'running'], true),

-- Home & Living - Kitchen
('Instant Pot Duo 7-in-1',
 'instant-pot-duo-7-in-1',
 'a1000000-0000-0000-0000-000000000003',
 'b1000000-0000-0000-0000-000000000009',
 '7-in-1 multi-use programmable pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer. 6-quart capacity, 13 one-touch programs, and safety features for peace of mind.',
 '7-in-1 | 6 Quart | 13 Programs | Stainless Steel',
 9999, 12999, 'SKU-IP-DUO6', 55,
 ARRAY['/uploads/products/instant-pot-1.webp'],
 '/uploads/products/instant-pot-1.webp',
 ARRAY['kitchen', 'pressure-cooker', 'instant-pot', 'cooking', 'appliance'], false),

('Minimalist Desk Lamp LED',
 'minimalist-desk-lamp-led',
 'a1000000-0000-0000-0000-000000000003',
 'b1000000-0000-0000-0000-000000000010',
 'Sleek architect-style LED desk lamp with 5 color temperatures, 10 brightness levels, USB-A charging port, and touch control. Perfect for home offices and study spaces.',
 'LED | 5 Color Temps | Touch Control | USB Charging',
 3499, 4499, 'SKU-LAMP-DESK-001', 90,
 ARRAY['/uploads/products/desk-lamp-1.webp', '/uploads/products/desk-lamp-2.webp'],
 '/uploads/products/desk-lamp-1.webp',
 ARRAY['lamp', 'led', 'desk', 'home-office', 'decor'], false),

-- Home & Living - Furniture
('Ergonomic Office Chair',
 'ergonomic-office-chair',
 'a1000000-0000-0000-0000-000000000003',
 'b1000000-0000-0000-0000-000000000008',
 'High-back mesh ergonomic office chair with lumbar support, adjustable armrests, headrest, and tilt mechanism. Designed for 8+ hours of comfortable sitting with breathable mesh back.',
 'Mesh Back | Lumbar Support | Adjustable | High-Back',
 24999, 32999, 'SKU-CHAIR-ERG-001', 30,
 ARRAY['/uploads/products/office-chair-1.webp'],
 '/uploads/products/office-chair-1.webp',
 ARRAY['chair', 'office', 'ergonomic', 'furniture', 'mesh'], true),

-- Sports - Gym Equipment
('Adjustable Dumbbell Set 5-52.5 lbs',
 'adjustable-dumbbell-set',
 'a1000000-0000-0000-0000-000000000004',
 'b1000000-0000-0000-0000-000000000011',
 'Bowflex-style adjustable dumbbell set that replaces 15 sets of weights. Quick-change dial mechanism for instant weight adjustments from 5 to 52.5 lbs in 2.5 lb increments. Compact storage tray included.',
 '5-52.5 lbs | 15-in-1 | Quick Dial | Compact',
 44999, 54999, 'SKU-DUMB-ADJ', 20,
 ARRAY['/uploads/products/dumbbell-adj-1.webp', '/uploads/products/dumbbell-adj-2.webp'],
 '/uploads/products/dumbbell-adj-1.webp',
 ARRAY['dumbbell', 'gym', 'fitness', 'weights', 'home-gym'], true),

('Yoga Mat Premium 6mm',
 'yoga-mat-premium-6mm',
 'a1000000-0000-0000-0000-000000000004',
 'b1000000-0000-0000-0000-000000000011',
 'Extra-thick 6mm eco-friendly TPE yoga mat with non-slip texture, alignment lines, carrying strap, and moisture-resistant surface. 183 x 61 cm, ideal for yoga, pilates, and stretching.',
 'TPE Eco | 6mm | Non-Slip | 183x61cm | Alignment Lines',
 1999, 2799, 'SKU-YOGA-MAT-6', 180,
 ARRAY['/uploads/products/yoga-mat-1.webp'],
 '/uploads/products/yoga-mat-1.webp',
 ARRAY['yoga', 'mat', 'fitness', 'pilates', 'eco'], false),

-- Sports - Activewear
('Dri-FIT Running Shorts',
 'dri-fit-running-shorts',
 'a1000000-0000-0000-0000-000000000004',
 'b1000000-0000-0000-0000-000000000012',
 'Lightweight Dri-FIT running shorts with 2-in-1 inner compression liner, reflective elements for low-light visibility, zippered back pocket, and 7-inch inseam. Ideal for running and gym workouts.',
 'Dri-FIT | 2-in-1 Compression | Reflective | Zip Pocket',
 1699, 2199, 'SKU-SHORTS-RUN-001', 250,
 ARRAY['/uploads/products/running-shorts-1.webp'],
 '/uploads/products/running-shorts-1.webp',
 ARRAY['shorts', 'running', 'gym', 'dri-fit', 'activewear'], false),

-- Books
('Clean Code by Robert C. Martin',
 'clean-code-robert-martin',
 'a1000000-0000-0000-0000-000000000005',
 'b1000000-0000-0000-0000-000000000014',
 'A handbook of agile software craftsmanship. This book is packed with real code examples and best practices for writing clean, readable, and maintainable code. Essential for every professional developer.',
 'Agile Craftsmanship | Code Examples | Best Practices',
 799, 999, 'SKU-BOOK-CC-001', 500,
 ARRAY['/uploads/products/clean-code-1.webp'],
 '/uploads/products/clean-code-1.webp',
 ARRAY['book', 'programming', 'clean-code', 'software', 'agile'], false),

('Atomic Habits by James Clear',
 'atomic-habits-james-clear',
 'a1000000-0000-0000-0000-000000000005',
 'b1000000-0000-0000-0000-000000000013',
 'The #1 New York Times bestseller about building good habits and breaking bad ones. James Clear reveals practical strategies for forming habits that stick, backed by biology, psychology, and neuroscience.',
 'Habit Building | Psychology | #1 NYT Bestseller',
 749, 950, 'SKU-BOOK-AH-001', 450,
 ARRAY['/uploads/products/atomic-habits-1.webp'],
 '/uploads/products/atomic-habits-1.webp',
 ARRAY['book', 'habits', 'self-help', 'productivity', 'psychology'], true),

('The Pragmatic Programmer',
 'the-pragmatic-programmer',
 'a1000000-0000-0000-0000-000000000005',
 'b1000000-0000-0000-0000-000000000014',
 'Revised and updated for the modern era, The Pragmatic Programmer covers everything from personal responsibility to career development, architectural techniques, pragmatic tools, and agile practices.',
 'Classic Dev Book | Updated Edition | Career & Architecture',
 849, 1099, 'SKU-BOOK-PP-001', 380,
 ARRAY['/uploads/products/pragmatic-prog-1.webp'],
 '/uploads/products/pragmatic-prog-1.webp',
 ARRAY['book', 'programming', 'software-engineering', 'agile', 'career'], false);

-- ============================================================
-- SAMPLE ORDERS (2 orders for testing)
-- ============================================================
WITH admin AS (SELECT id FROM "Users" WHERE email = 'admin@shopwave.com' LIMIT 1)
INSERT INTO "Orders" (
    user_id, order_number, status, payment_status, payment_method,
    subtotal, shipping_charge, total,
    shipping_name, shipping_phone, shipping_address, shipping_city
)
SELECT
    admin.id, 'ORD-2024-000001', 'delivered', 'paid', 'cod',
    1899.00, 60.00, 1959.00,
    'John Doe', '01711223344', 'House 12, Road 5, Dhanmondi', 'Dhaka'
FROM admin;

WITH admin AS (SELECT id FROM "Users" WHERE email = 'admin@shopwave.com' LIMIT 1),
     ord AS (SELECT id FROM "Orders" WHERE order_number = 'ORD-2024-000001' LIMIT 1),
     prod AS (SELECT id, name, sku, thumbnail FROM "Products" WHERE slug = 'premium-cotton-polo-shirt' LIMIT 1)
INSERT INTO "OrderItems" (order_id, product_id, product_name, product_sku, thumbnail, quantity, unit_price, total_price)
SELECT ord.id, prod.id, prod.name, prod.sku, prod.thumbnail, 2, 1899.00, 3798.00
FROM admin, ord, prod;

WITH admin AS (SELECT id FROM "Users" WHERE email = 'admin@shopwave.com' LIMIT 1)
INSERT INTO "Orders" (
    user_id, order_number, status, payment_status, payment_method,
    subtotal, shipping_charge, total,
    shipping_name, shipping_phone, shipping_address, shipping_city
)
SELECT
    admin.id, 'ORD-2024-000002', 'processing', 'paid', 'bkash',
    34999.00, 0.00, 34999.00,
    'Jane Smith', '01811223344', 'Apt 4B, Mirpur-10', 'Dhaka'
FROM admin;

WITH ord AS (SELECT id FROM "Orders" WHERE order_number = 'ORD-2024-000002' LIMIT 1),
     prod AS (SELECT id, name, sku, thumbnail FROM "Products" WHERE slug = 'sony-wh-1000xm5' LIMIT 1)
INSERT INTO "OrderItems" (order_id, product_id, product_name, product_sku, thumbnail, quantity, unit_price, total_price)
SELECT ord.id, prod.id, prod.name, prod.sku, prod.thumbnail, 1, 34999.00, 34999.00
FROM ord, prod;
