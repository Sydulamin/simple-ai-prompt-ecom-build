
-- Inventory Stock Movements Table (Audit Trail)
CREATE TABLE IF NOT EXISTS "StockMovements" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES "Products"(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment')), -- stock in, out or manual adjustment
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason TEXT, -- e.g., "Order #ORD-123", "Restock from supplier", "Manual adjustment"
  reference_id UUID, -- optional, can link to order ID, etc.
  created_by UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stockmovements_product ON "StockMovements"(product_id);
CREATE INDEX idx_stockmovements_created ON "StockMovements"(created_at DESC);
