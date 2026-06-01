# Curl Examples

Start the server:

```bash
npm run dev
```

List couriers:

```bash
curl http://localhost:3000/api/v1/couriers
```

Create an order:

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d "{\"order_id\":\"ORD-1001\",\"courier_partner\":\"mock_courier\",\"payment_mode\":\"COD\",\"declared_value\":1200,\"collectable_value\":1200}"
```

Track an order:

```bash
curl http://localhost:3000/api/v1/orders/ORD-1001/track
```

Get stored tracking history:

```bash
curl http://localhost:3000/api/v1/orders/ORD-1001/tracking-history
```

Cancel an order:

```bash
curl -X POST http://localhost:3000/api/v1/orders/ORD-1001/cancel
```

Bulk create:

```bash
curl -X POST http://localhost:3000/api/v1/orders/bulk \
  -H "Content-Type: application/json" \
  -d "{\"orders\":[{\"order_id\":\"ORD-1001\",\"courier_partner\":\"mock_courier\"},{\"order_id\":\"ORD-1002\",\"courier_partner\":\"mock_courier\"}]}"
```

Get bulk batch status:

```bash
curl http://localhost:3000/api/v1/orders/bulk/<batch_id>
```
