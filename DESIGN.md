# Design

## Architecture

The service uses Express with plain controllers, services, repositories, and courier adapters. Consumers call one normalized REST API and pass `courier_partner`; courier-specific request and response formats stay inside each adapter.

```txt
Routes -> Controllers -> Services -> Courier Registry -> Courier Adapter
                                 |
                                 v
                            Repositories
```

## Courier Pattern

Courier integrations implement the `CourierAdapter` contract:

- `createShipment`
- `trackShipment`
- `cancelShipment`

The registry resolves adapters by normalized partner code. `mock_courier` is used for local testing and `urbanebolt` is the first real external adapter. Adding a new courier should only require a new adapter folder and registration.

## Persistence

The Prisma schema contains permanent business data only:

- `orders`
- `tracking_history`
- `courier_tokens`

Tracking history is append-only. Every tracking call stores courier events separately from the order's current status.

## Bulk Processing

Bulk create accepts up to 100 orders and returns per-order success/failure results. This implementation processes orders concurrently in-process and avoids permanent batch tables. The trade-off is that the HTTP request stays open while work completes; the benefit is a smaller implementation with clear partial-success behavior.

Redis/BullMQ can later be added behind the same `POST /api/v1/orders/bulk` request shape if asynchronous batch status becomes necessary.

## Error Handling

The API returns normalized error objects. Joi validation errors return field-level details. Unknown couriers return supported courier codes. UrbaneBolt 4xx/5xx responses are mapped to internal error codes instead of leaking raw courier errors to API consumers.

## Trade-Offs

- In-memory repositories are used by default for local tests and fast development.
- Prisma schema is ready for PostgreSQL persistence.
- UrbaneBolt integration is isolated behind mapper/client/auth files.
- No permanent bulk tables are used because batch status is temporary operational state.
