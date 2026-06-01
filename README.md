# Multi-Courier Integration Platform

Backend service for an e-commerce logistics platform that exposes one unified API for shipment creation, tracking, cancellation, and bulk order processing across multiple courier partners.

The first concrete courier integration is UrbaneBolt. The architecture is designed so that future partners such as Delhivery, Shiprocket, Bluedart, or DTDC can be added with minimal changes to the core application.

## Goals

- Provide a courier-agnostic REST API for internal consumers.
- Keep courier-specific payloads and response formats isolated inside adapter modules.
- Persist orders, courier responses, and tracking history for audit and debugging.
- Support bulk order creation with Redis/BullMQ background processing and per-order results.
- Normalize validation errors, courier errors, retries, and authentication failures.

## Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Joi
- Axios
- Winston
- Vitest

## High-Level Architecture

```txt
Client / OMS / Frontend
        |
        v
Express Routes
        |
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
GET  /api/v1/orders/:orderId/tracking-history
GET  /api/v1/couriers
GET  /api/v1/couriers/:courierPartner
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

Bulk order creation queues up to 100 orders with BullMQ and returns a `batch_id` immediately.

The worker processes each batch concurrently and stores temporary batch status/results in Redis. PostgreSQL is the permanent source of truth for orders, tracking history, and courier auth tokens through Prisma-backed repositories.

```txt
POST /api/v1/orders/bulk
        |
        v
Validate up to 100 orders
        |
        v
Queue batch in BullMQ
        |
        v
Worker processes orders concurrently
        |
        v
Store per-order results in Redis
```

The system intentionally avoids permanent `BulkBatch` and `BulkBatchItem` tables because Redis holds temporary batch status.

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
    courier.routes.ts
    health.routes.ts

  controllers/
    order.controller.ts
    courier.controller.ts

  helpers/
    validation.helper.ts
    response.helper.ts

  services/
    order.service.ts
    tracking.service.ts

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

  repositories/
    order.repository.ts
    tracking-history.repository.ts
    courier-token.repository.ts

  prisma/
    client.ts

  utils/
    retry.ts
    logger.ts
```

## Database Scope

The initial PostgreSQL schema will focus on permanent business data:

- `Order`
- `TrackingHistory`
- `CourierToken`

Orders, tracking history, and courier auth tokens are stored in PostgreSQL through Prisma repositories. Bulk batch progress is returned directly in the response and is not stored permanently.

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

## Example Requests

```bash
curl http://localhost:3000/api/v1/couriers
```

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d "{\"order_id\":\"ORD-1001\",\"courier_partner\":\"mock_courier\",\"payment_mode\":\"COD\"}"
```

```bash
curl http://localhost:3000/api/v1/orders/ORD-1001/track
```

```bash
curl http://localhost:3000/api/v1/orders/ORD-1001/tracking-history
```

```bash
curl -X POST http://localhost:3000/api/v1/orders/ORD-1001/cancel
```

```bash
curl -X POST http://localhost:3000/api/v1/orders/bulk \
  -H "Content-Type: application/json" \
  -d "{\"orders\":[{\"order_id\":\"ORD-1001\",\"courier_partner\":\"mock_courier\"},{\"order_id\":\"ORD-1002\",\"courier_partner\":\"mock_courier\"}]}"
```

```bash
curl http://localhost:3000/api/v1/orders/bulk/<batch_id>
```

## Design Pattern

The project uses the Adapter/Strategy pattern for courier integrations.

New courier partners should be added by creating a new adapter that implements the common courier contract. The route, controller, service, and normalized API schema should remain unchanged.
