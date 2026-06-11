-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
-- Phase 1 of the storefront augmentation plan: extend the existing `products`
-- table with the storefront-shaped fields (slug, gallery, sale price,
-- fulfillment, status) and introduce a sibling `product_variants` table.
-- Both backfills preserve any existing rows: slugs are derived from name,
-- the legacy single `image_url` becomes the first entry in `images[]`, and
-- any product whose is_active=false maps to status='archived'.

ALTER TABLE products ADD COLUMN IF NOT EXISTS slug              text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price  numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images            text[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS fulfillment_type  text   NOT NULL DEFAULT 'manual';
ALTER TABLE products ADD COLUMN IF NOT EXISTS status            text   NOT NULL DEFAULT 'active';

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_fulfillment_type_check;
ALTER TABLE products
  ADD CONSTRAINT products_fulfillment_type_check
  CHECK (fulfillment_type IN ('manual','pod','digital','service'));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_status_check
  CHECK (status IN ('draft','active','archived'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_client_slug
  ON products (client_id, slug) WHERE slug IS NOT NULL;

UPDATE products
   SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
 WHERE slug IS NULL;

UPDATE products
   SET images = ARRAY[image_url]
 WHERE image_url IS NOT NULL
   AND (images IS NULL OR cardinality(images) = 0);

UPDATE products SET status = 'archived' WHERE is_active = false AND status = 'active';

CREATE TABLE IF NOT EXISTS product_variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label         text NOT NULL,
  price         numeric,
  stock_qty     integer,
  sku           text,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product
  ON product_variants (product_id, display_order);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seller can manage own product variants" ON product_variants;
CREATE POLICY "Seller can manage own product variants"
  ON product_variants FOR ALL TO authenticated
  USING ( EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_variants.product_id AND p.client_id = auth.uid()
  ))
  WITH CHECK ( EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_variants.product_id AND p.client_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Public can read variants of active products" ON product_variants;
CREATE POLICY "Public can read variants of active products"
  ON product_variants FOR SELECT TO anon
  USING ( EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_variants.product_id
      AND p.is_active = true
      AND p.status = 'active'
  ));

DROP POLICY IF EXISTS "Service role full access on product_variants" ON product_variants;
CREATE POLICY "Service role full access on product_variants"
  ON product_variants FOR ALL TO service_role
  USING (true) WITH CHECK (true);
