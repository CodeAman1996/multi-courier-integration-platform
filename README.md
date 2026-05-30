# Multi-Courier Integration Platform

Backend service for an e-commerce logistics platform that exposes one unified API for shipment creation, tracking, cancellation, and bulk order processing across multiple courier partners.

The first concrete courier integration is UrbaneBolt. The architecture is designed so that future partners such as Delhivery, Shiprocket, Bluedart, or DTDC can be added with minimal changes to the core application.

## Goals

- Provide a courier-agnostic REST API for internal consumers.
- Keep courier-specific payloads and response formats isolated inside adapter modules.
- Persist orders, courier responses, and tracking history for audit and debugging.
- Support bulk order creation with fast API responses using Redis/BullMQ background processing.
- Normalize validation errors, courier errors, retries, and authentication failures.

## Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Zod
- Axios
- Pino
- Vitest

## High-Level Architecture

```txt
Client / OMS / Frontend
        |
        v
Express Routes
        |
        v
Validation Middleware
        |
        v
Controllers
        |
        v
Services
        |
        v
Courier Registry
        |
        +----------------------+
        |                      |
        v                      v
UrbaneBolt Adapter       MockCourier Adapter
        |
        v
UrbaneBolt UAT API
        |
        v
PostgreSQL via Prisma
```

The core application depends on a common courier adapter contract. Each courier implements that contract in its own folder. Controllers and services do not know the courier-specific request or response format.

## Planned API Endpoints

```txt
POST /api/v1/orders
GET  /api/v1/orders/:orderId/track
POST /api/v1/orders/:orderId/cancel
POST /api/v1/orders/bulk
GET  /api/v1/orders/bulk/:batchId
```

Every create-order request accepts a `courier_partner` field, for example:

```json
{
  "courier_partner": "urbanebolt",
  "order_id": "ORD-1001",
  "payment_mode": "COD",
  "declared_value": 1200,
  "collectable_value": 1200
}
```

The rest of the payload follows the platform's normalized internal schema. Consumers do not need to know UrbaneBolt's API fields.

## Bulk Processing Approach

Bulk order creation will use Redis and BullMQ instead of dedicated `BulkBatch` and `BulkBatchItem` database tables.

PostgreSQL remains the permanent source of truth for orders and tracking history. Redis stores temporary batch progress and per-order results with a TTL.

```txt
POST /api/v1/orders/bulk
        |
        v
Validate up to 100 orders
        |
        v
Create batch_id
        |
        v
Store temporary batch metadata in Redis
        |
        v
Enqueue each order in BullMQ
        |
        v
Return batch_id immediately
```

This keeps the API responsive while avoiding extra permanent tables for short-lived bulk status data.

## Planned Folder Structure

```txt
src/
  app.ts
  server.ts

  config/
    env.ts
    couriers.ts
    redis.ts

  routes/
    order.routes.ts
    bulk-order.routes.ts
    health.routes.ts

  controllers/
    order.controller.ts
    bulk-order.controller.ts

  validators/
    validate.ts
    order.validator.ts
    bulk-order.validator.ts

  services/
    order.service.ts
    tracking.service.ts
    bulk-order.service.ts

  couriers/
    courier-adapter.ts
    courier-registry.ts
    courier.types.ts

    urbanebolt/
      urbanebolt.adapter.ts
      urbanebolt.client.ts
      urbanebolt.auth.ts
      urbanebolt.mapper.ts
      urbanebolt.error-mapper.ts
      urbanebolt.types.ts

    mock-courier/
      mock-courier.adapter.ts

  jobs/
    bulk-order.queue.ts
    bulk-order.worker.ts
    bulk-order.processor.ts

  redis/
    redis.client.ts
    bulk-status.store.ts

  repositories/
    order.repository.ts
    tracking-history.repository.ts
    courier-token.repository.ts

  prisma/
    client.ts

  middlewares/
    error.middleware.ts
    request-id.middleware.ts
    logger.middleware.ts

  utils/
    app-error.ts
    error-codes.ts
    retry.ts
    logger.ts
```

## Database Scope

The initial PostgreSQL schema will focus on permanent business data:

- `Order`
- `TrackingHistory`
- `CourierToken`

Bulk batch progress will be stored in Redis because it is temporary operational state.

## Development Scripts

```txt
npm run dev
npm run build
npm start
npm test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Design Pattern

The project uses the Adapter/Strategy pattern for courier integrations.

New courier partners should be added by creating a new adapter that implements the common courier contract. The route, controller, service, and normalized API schema should remain unchanged.
