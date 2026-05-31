-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('COD', 'PREPAID');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "internal_order_id" TEXT NOT NULL,
    "courier_partner" TEXT NOT NULL,
    "courier_order_id" TEXT,
    "awb_number" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "payment_mode" "PaymentMode",
    "original_request_payload" JSONB NOT NULL,
    "courier_request_payload" JSONB,
    "courier_response_payload" JSONB,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "awb_number" TEXT,
    "status" "OrderStatus" NOT NULL,
    "location" TEXT,
    "event_time" TIMESTAMP(3),
    "raw_payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_tokens" (
    "id" TEXT NOT NULL,
    "courier_partner" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courier_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_internal_order_id_key" ON "orders"("internal_order_id");

-- CreateIndex
CREATE INDEX "orders_courier_partner_idx" ON "orders"("courier_partner");

-- CreateIndex
CREATE INDEX "orders_awb_number_idx" ON "orders"("awb_number");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "tracking_history_order_id_idx" ON "tracking_history"("order_id");

-- CreateIndex
CREATE INDEX "tracking_history_awb_number_idx" ON "tracking_history"("awb_number");

-- CreateIndex
CREATE INDEX "tracking_history_status_idx" ON "tracking_history"("status");

-- CreateIndex
CREATE UNIQUE INDEX "courier_tokens_courier_partner_key" ON "courier_tokens"("courier_partner");

-- AddForeignKey
ALTER TABLE "tracking_history" ADD CONSTRAINT "tracking_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
