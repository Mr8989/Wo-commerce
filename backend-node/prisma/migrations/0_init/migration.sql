-- Baseline schema, identical in shape to the one Django's migrations produced.
--
-- Fresh database:    npm run migrate:deploy      (runs this file)
-- Existing Django DB: npm run migrate:baseline   (marks it applied, runs nothing)

CREATE TABLE "store_category" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "store_category_slug_key" ON "store_category"("slug");

CREATE TABLE "store_product" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "category_id" BIGINT NOT NULL,
    "image" VARCHAR(100),
    "image_url" VARCHAR(200),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "available_sizes" JSONB NOT NULL DEFAULT '[]',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "store_product_slug_key" ON "store_product"("slug");
CREATE INDEX "store_product_category_id_idx" ON "store_product"("category_id");
CREATE INDEX "store_product_is_featured_is_active_idx" ON "store_product"("is_featured", "is_active");

CREATE TABLE "store_anonymoususer" (
    "id" BIGSERIAL NOT NULL,
    "fingerprint" VARCHAR(255) NOT NULL,
    "session_id" VARCHAR(255) NOT NULL DEFAULT '',
    "email" VARCHAR(254),
    "first_name" VARCHAR(100) NOT NULL DEFAULT '',
    "last_name" VARCHAR(100) NOT NULL DEFAULT '',
    "phone" VARCHAR(20) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_anonymoususer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "store_anonymoususer_fingerprint_key" ON "store_anonymoususer"("fingerprint");

CREATE TABLE "store_order" (
    "id" BIGSERIAL NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "anonymous_user_id" BIGINT,
    "email" VARCHAR(254) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "delivery_address" VARCHAR(255) NOT NULL,
    "delivery_city" VARCHAR(100) NOT NULL,
    "delivery_state" VARCHAR(100) NOT NULL,
    "delivery_postal_code" VARCHAR(20) NOT NULL,
    "delivery_country" VARCHAR(100) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payment_method" VARCHAR(20) NOT NULL DEFAULT 'bank_transfer',
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "store_order_order_number_key" ON "store_order"("order_number");
CREATE INDEX "store_order_anonymous_user_id_idx" ON "store_order"("anonymous_user_id");
CREATE INDEX "store_order_status_idx" ON "store_order"("status");

CREATE TABLE "store_orderitem" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "size" VARCHAR(10) NOT NULL DEFAULT '',
    "price" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "store_orderitem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "store_orderitem_order_id_idx" ON "store_orderitem"("order_id");
CREATE INDEX "store_orderitem_product_id_idx" ON "store_orderitem"("product_id");

CREATE TABLE "store_cartitem" (
    "id" BIGSERIAL NOT NULL,
    "anonymous_user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "size" VARCHAR(10) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_cartitem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "store_cartitem_anonymous_user_id_product_id_size_key"
    ON "store_cartitem"("anonymous_user_id", "product_id", "size");
CREATE INDEX "store_cartitem_product_id_idx" ON "store_cartitem"("product_id");

CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(150) NOT NULL,
    "password" VARCHAR(128) NOT NULL,
    "email" VARCHAR(254),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMPTZ(6),
    "auth_token" VARCHAR(64),
    "token_created_at" TIMESTAMPTZ(6),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "verification_code" VARCHAR(6),
    "verification_code_expires" TIMESTAMPTZ(6),
    "verification_code_used" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");
CREATE UNIQUE INDEX "admin_users_auth_token_key" ON "admin_users"("auth_token");

-- Foreign keys, matching the ones Django created. They carry no ON DELETE
-- clause: cascades are applied by the application (relationMode = "prisma"),
-- exactly as Django applied them in Python.
ALTER TABLE "store_product"
    ADD CONSTRAINT "store_product_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "store_category"("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "store_order"
    ADD CONSTRAINT "store_order_anonymous_user_id_fkey"
    FOREIGN KEY ("anonymous_user_id") REFERENCES "store_anonymoususer"("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "store_orderitem"
    ADD CONSTRAINT "store_orderitem_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "store_order"("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "store_orderitem"
    ADD CONSTRAINT "store_orderitem_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "store_product"("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "store_cartitem"
    ADD CONSTRAINT "store_cartitem_anonymous_user_id_fkey"
    FOREIGN KEY ("anonymous_user_id") REFERENCES "store_anonymoususer"("id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "store_cartitem"
    ADD CONSTRAINT "store_cartitem_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "store_product"("id") DEFERRABLE INITIALLY DEFERRED;
