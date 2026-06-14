
-- ============================================================
-- COUPONS TABLE
-- ============================================================
CREATE TYPE coupon_type AS ENUM ('fixed', 'percentage');

CREATE TABLE "Coupons" (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code              VARCHAR(50) NOT NULL UNIQUE, -- Coupon code (e.g., SAVE20)
    type              coupon_type NOT NULL,        -- 'fixed' or 'percentage'
    value             NUMERIC(12, 2) NOT NULL,     -- Discount amount (fixed or %)
    min_order_value   NUMERIC(12, 2) DEFAULT 0,    -- Min order value to apply coupon
    max_discount      NUMERIC(12, 2),              -- Max discount amount (for percentage coupons)
    usage_limit       INT,                          -- Max total uses
    usage_limit_per_user INT,                       -- Max uses per user
    expires_at        TIMESTAMPTZ,                  -- Coupon expiry date
    is_active         BOOLEAN NOT NULL DEFAULT true,
    description       TEXT,
    created_by        UUID REFERENCES "Users"(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COUPON USAGE TABLE (TRACK WHO USED WHICH COUPON)
-- ============================================================
CREATE TABLE "CouponUsages" (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id     UUID NOT NULL REFERENCES "Coupons"(id) ON DELETE CASCADE,
    user_id       UUID REFERENCES "Users"(id) ON DELETE SET NULL,
    order_id      UUID REFERENCES "Orders"(id) ON DELETE CASCADE,
    discount_applied NUMERIC(12, 2) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_coupons_code ON "Coupons"(code);
CREATE INDEX idx_coupons_active ON "Coupons"(is_active) WHERE is_active = true;
CREATE INDEX idx_coupon_usages_coupon_id ON "CouponUsages"(coupon_id);
CREATE INDEX idx_coupon_usages_user_id ON "CouponUsages"(user_id);
CREATE INDEX idx_coupon_usages_order_id ON "CouponUsages"(order_id);

-- ============================================================
-- UPDATE TRIGGERS
-- ============================================================
CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON "Coupons"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
