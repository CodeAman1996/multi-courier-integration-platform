export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Multi-Courier Integration Platform API',
    version: '1.0.0',
    description:
      'Unified API for courier listing, shipment creation, tracking, cancellation, and BullMQ-based bulk order processing. Clients can pass x-request-id for traceable logs.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Couriers' },
    { name: 'Orders' },
    { name: 'Bulk Orders' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check service health',
        responses: {
          '200': {
            description: 'Service is running',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/couriers': {
      get: {
        tags: ['Couriers'],
        summary: 'List supported couriers',
        responses: {
          '200': {
            description: 'Supported courier partners',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CourierListResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/couriers/{courierPartner}': {
      get: {
        tags: ['Couriers'],
        summary: 'Get courier support details',
        parameters: [{ $ref: '#/components/parameters/CourierPartner' }],
        responses: {
          '200': {
            description: 'Courier details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CourierResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/api/v1/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create a shipment order',
        parameters: [{ $ref: '#/components/parameters/RequestId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderRequest' },
              example: {
                order_id: 'ORD-1001',
                courier_partner: 'mock_courier',
                payment_mode: 'COD',
                declared_value: 1200,
                collectable_value: 1200,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Shipment created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateOrderResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ErrorResponse' },
          '409': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/api/v1/orders/{orderId}/track': {
      get: {
        tags: ['Orders'],
        summary: 'Track an order',
        parameters: [
          { $ref: '#/components/parameters/RequestId' },
          { $ref: '#/components/parameters/OrderId' },
        ],
        responses: {
          '200': {
            description: 'Current tracking status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrackOrderResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/api/v1/orders/{orderId}/tracking-history': {
      get: {
        tags: ['Orders'],
        summary: 'Get stored tracking history',
        parameters: [
          { $ref: '#/components/parameters/RequestId' },
          { $ref: '#/components/parameters/OrderId' },
        ],
        responses: {
          '200': {
            description: 'Tracking history',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TrackingHistoryResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/api/v1/orders/{orderId}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Cancel an order',
        parameters: [
          { $ref: '#/components/parameters/RequestId' },
          { $ref: '#/components/parameters/OrderId' },
        ],
        responses: {
          '200': {
            description: 'Cancellation result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CancelOrderResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/api/v1/orders/bulk': {
      post: {
        tags: ['Bulk Orders'],
        summary: 'Queue bulk order creation',
        description:
          'Queues up to 100 orders in BullMQ and returns a batch id immediately. Use the batch status API to check results.',
        parameters: [{ $ref: '#/components/parameters/RequestId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BulkCreateOrderRequest' },
              example: {
                orders: [
                  {
                    order_id: 'ORD-BULK-1001',
                    courier_partner: 'mock_courier',
                    payment_mode: 'COD',
                    declared_value: 500,
                    collectable_value: 500,
                  },
                  {
                    order_id: 'ORD-BULK-1002',
                    courier_partner: 'mock_courier',
                    payment_mode: 'PREPAID',
                    declared_value: 800,
                    collectable_value: 0,
                  },
                ],
              },
            },
          },
        },
        responses: {
          '202': {
            description: 'Bulk order batch queued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BulkQueueResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
    '/api/v1/orders/bulk/{batchId}': {
      get: {
        tags: ['Bulk Orders'],
        summary: 'Get bulk order batch status',
        parameters: [
          { $ref: '#/components/parameters/RequestId' },
          { $ref: '#/components/parameters/BatchId' },
        ],
        responses: {
          '200': {
            description: 'Batch status and per-order results',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BulkStatusResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/ErrorResponse' },
        },
      },
    },
  },
  components: {
    parameters: {
      RequestId: {
        name: 'x-request-id',
        in: 'header',
        required: false,
        schema: { type: 'string' },
        description: 'Optional request id used in API logs. The same value is returned in the response header.',
        example: 'req-123',
      },
      OrderId: {
        name: 'orderId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        example: 'ORD-1001',
      },
      BatchId: {
        name: 'batchId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
      CourierPartner: {
        name: 'courierPartner',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        example: 'mock_courier',
      },
    },
    responses: {
      ErrorResponse: {
        description: 'Error response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
    schemas: {
      SuccessWrapper: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', nullable: true },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Request validation failed' },
              details: { nullable: true },
            },
          },
        },
      },
      HealthResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessWrapper' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  service: {
                    type: 'string',
                    example: 'multi-courier-integration-platform',
                  },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        ],
      },
      CourierListResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessWrapper' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  supported_couriers: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['mock_courier', 'urbanebolt'],
                  },
                },
              },
            },
          },
        ],
      },
      CourierResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessWrapper' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  courier_partner: { type: 'string', example: 'mock_courier' },
                  supported: { type: 'boolean', example: true },
                },
              },
            },
          },
        ],
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['order_id', 'courier_partner'],
        properties: {
          order_id: { type: 'string', example: 'ORD-1001' },
          courier_partner: { type: 'string', example: 'mock_courier' },
          payment_mode: { type: 'string', enum: ['COD', 'PREPAID'], example: 'COD' },
          declared_value: { type: 'number', minimum: 0, example: 1200 },
          collectable_value: { type: 'number', minimum: 0, example: 1200 },
        },
        additionalProperties: true,
      },
      CreateOrderResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessWrapper' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/Order' },
            },
          },
        ],
      },
      Order: {
        type: 'object',
        properties: {
          order_id: { type: 'string', example: 'ORD-1001' },
          courier_partner: { type: 'string', example: 'mock_courier' },
          courier_order_id: { type: 'string', example: 'MOCK-ORD-1001' },
          awb_number: { type: 'string', example: 'AWB-ORD-1001' },
          status: { type: 'string', example: 'CREATED' },
          courier_request_payload: {
            type: 'object',
            nullable: true,
            description: 'Actual payload sent to the courier for audit/debugging.',
          },
          failure_reason: {
            type: 'string',
            nullable: true,
            example: 'COURIER_UNAVAILABLE: Courier service is temporarily unavailable',
          },
        },
      },
      TrackOrderResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessWrapper' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  order_id: { type: 'string', example: 'ORD-1001' },
                  courier_partner: { type: 'string', example: 'mock_courier' },
                  awb_number: { type: 'string', example: 'AWB-ORD-1001' },
                  status: { type: 'string', example: 'IN_TRANSIT' },
                  history: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TrackingEvent' },
                  },
                },
              },
            },
          },
        ],
      },
      TrackingHistoryResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessWrapper' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  order_id: { type: 'string', example: 'ORD-1001' },
                  courier_partner: { type: 'string', example: 'mock_courier' },
                  awb_number: { type: 'string', example: 'AWB-ORD-1001' },
                  history: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TrackingEvent' },
                  },
                },
              },
            },
          },
        ],
      },
      TrackingEvent: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'IN_TRANSIT' },
          location: { type: 'string', example: 'Delhi Hub' },
          timestamp: { type: 'string', format: 'date-time' },
        },
        additionalProperties: true,
      },
      CancelOrderResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessWrapper' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  order_id: { type: 'string', example: 'ORD-1001' },
                  courier_partner: { type: 'string', example: 'mock_courier' },
                  awb_number: { type: 'string', example: 'AWB-ORD-1001' },
                  status: { type: 'string', example: 'CANCELLED' },
                  cancelled: { type: 'boolean', example: true },
                },
              },
            },
          },
        ],
      },
      BulkCreateOrderRequest: {
        type: 'object',
        required: ['orders'],
        properties: {
          orders: {
            type: 'array',
            minItems: 1,
            maxItems: 100,
            items: { $ref: '#/components/schemas/CreateOrderRequest' },
          },
        },
      },
      BulkQueueResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessWrapper' },
          {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  batch_id: { type: 'string', format: 'uuid' },
                  status: { type: 'string', example: 'QUEUED' },
                  total_orders: { type: 'integer', example: 2 },
                },
              },
            },
          },
        ],
      },
      BulkStatusResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessWrapper' },
          {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/BulkBatch' },
            },
          },
        ],
      },
      BulkBatch: {
        type: 'object',
        properties: {
          batch_id: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
          },
          total: { type: 'integer', example: 2 },
          completed: { type: 'integer', example: 2 },
          success: { type: 'integer', example: 2 },
          failed: { type: 'integer', example: 0 },
          results: {
            type: 'array',
            items: { $ref: '#/components/schemas/BulkOrderResult' },
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      BulkOrderResult: {
        type: 'object',
        properties: {
          order_id: { type: 'string', example: 'ORD-BULK-1001' },
          success: { type: 'boolean', example: true },
          data: { $ref: '#/components/schemas/Order' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'ORDER_CREATE_FAILED' },
              message: { type: 'string', example: 'Order could not be created' },
            },
          },
        },
      },
    },
  },
};
