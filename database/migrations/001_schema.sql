-- ============================================================
-- E-Commerce Platform - Neon PostgreSQL Schema
-- Production-Ready with Full Indexing Strategy
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- trigram for ILIKE fast search

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cod', 'bkash', 'sslcommerz');

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE "Users" (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    avatar_url    TEXT,
    role          user_role NOT NULL DEFAULT 'customer',
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_role  ON "Users"(role);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE "Categories" (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    image_url   TEXT,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON "Categories"(slug);

-- ============================================================
-- SUBCATEGORIES TABLE
-- ============================================================
CREATE TABLE "Subcategories" (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES "Categories"(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    image_url   TEXT,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subcategories_category_id ON "Subcategories"(category_id);
CREATE INDEX idx_subcategories_slug        ON "Subcategories"(slug);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE "Products" (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id      UUID NOT NULL REFERENCES "Categories"(id) ON DELETE RESTRICT,
    subcategory_id   UUID REFERENCES "Subcategories"(id) ON DELETE SET NULL,
    name             VARCHAR(255) NOT NULL,
    slug             VARCHAR(280) NOT NULL UNIQUE,
    description      TEXT,
    short_description VARCHAR(500),
    price            NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    compare_price    NUMERIC(12, 2) CHECK (compare_price >= 0),
    cost_price       NUMERIC(12, 2) CHECK (cost_price >= 0),
    sku              VARCHAR(100) UNIQUE,
    stock            INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5,
    images           TEXT[] NOT NULL DEFAULT '{}',   -- array of WebP URLs
    thumbnail        TEXT,
    tags             TEXT[] NOT NULL DEFAULT '{}',
    is_active        BOOLEAN NOT NULL DEFAULT true,
    is_featured      BOOLEAN NOT NULL DEFAULT false,
    weight_gram      INT,
    meta_title       VARCHAR(255),
    meta_description TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B-Tree index on name for ORDER BY / equality lookups
CREATE INDEX idx_products_name         ON "Products"("name");
-- GIN index on tags array for @> containment queries
CREATE INDEX idx_products_tags         ON "Products" USING GIN ("tags");
-- GIN trigram index on name for fast ILIKE / full-text search
CREATE INDEX idx_products_name_trgm    ON "Products" USING GIN ("name" gin_trgm_ops);
-- GIN trigram index on description for full-text search
CREATE INDEX idx_products_desc_trgm    ON "Products" USING GIN ("description" gin_trgm_ops);
-- Covering index for listing pages (active + category filter)
CREATE INDEX idx_products_category_active ON "Products"(category_id, is_active, created_at DESC);
CREATE INDEX idx_products_subcategory     ON "Products"(subcategory_id, is_active);
CREATE INDEX idx_products_featured        ON "Products"(is_featured, is_active);
CREATE INDEX idx_products_price           ON "Products"(price);
CREATE INDEX idx_products_stock_low       ON "Products"(stock) WHERE stock <= low_stock_threshold;

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE "Orders" (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID REFERENCES "Users"(id) ON DELETE SET NULL,
    order_number     VARCHAR(30) NOT NULL UNIQUE,
    status           order_status NOT NULL DEFAULT 'pending',
    payment_status   payment_status NOT NULL DEFAULT 'pending',
    payment_method   payment_method NOT NULL,
    subtotal         NUMERIC(12, 2) NOT NULL,
    shipping_charge  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total            NUMERIC(12, 2) NOT NULL,

    -- Shipping address snapshot (denormalized for order history integrity)
    shipping_name    VARCHAR(120) NOT NULL,
    shipping_phone   VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city    VARCHAR(80) NOT NULL,
    shipping_zip     VARCHAR(20),

    -- Payment gateway metadata
    gateway_session_id  TEXT,
    gateway_trx_id      TEXT,
    gateway_response    JSONB,

    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id       ON "Orders"(user_id);
CREATE INDEX idx_orders_status        ON "Orders"(status);
CREATE INDEX idx_orders_payment_status ON "Orders"(payment_status);
CREATE INDEX idx_orders_order_number  ON "Orders"(order_number);
CREATE INDEX idx_orders_created_at    ON "Orders"(created_at DESC);
CREATE INDEX idx_orders_gateway_trx   ON "Orders"(gateway_trx_id) WHERE gateway_trx_id IS NOT NULL;

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE "OrderItems" (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id     UUID NOT NULL REFERENCES "Orders"(id) ON DELETE CASCADE,
    product_id   UUID REFERENCES "Products"(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,   -- snapshot at purchase time
    product_sku  VARCHAR(100),
    thumbnail    TEXT,
    quantity     INT NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(12, 2) NOT NULL,  -- verified server-side price
    total_price  NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id   ON "OrderItems"(order_id);
CREATE INDEX idx_order_items_product_id ON "OrderItems"(product_id);

-- ============================================================
-- ADDRESSES TABLE (saved addresses per user)
-- ============================================================
CREATE TABLE "Addresses" (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    label      VARCHAR(50) DEFAULT 'Home',
    name       VARCHAR(120) NOT NULL,
    phone      VARCHAR(20) NOT NULL,
    address    TEXT NOT NULL,
    city       VARCHAR(80) NOT NULL,
    zip        VARCHAR(20),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON "Addresses"(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON "Users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON "Categories"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subcategories_updated_at
    BEFORE UPDATE ON "Subcategories"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON "Products"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON "Orders"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
