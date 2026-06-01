import { randomUUID } from 'node:crypto';

import { UnknownCourierError } from '../couriers/courier-registry.js';
import { logFailure } from '../helpers/error-log.helper.js';
import type { BulkCreateOrdersRequest } from '../helpers/validation.helper.js';
import { enqueueBulkOrderJob, type BulkOrderJobData } from '../queues/bulk-order.queue.js';
import { redis } from '../redis/client.js';
import { DuplicateOrderError, orderService, type OrderService } from './order.service.js';

type BulkOrderStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

type BulkOrderSuccessResult = {
  order_id: string;
  success: true;
  data: {
    courier_partner: string;
    courier_order_id?: string;
    awb_number?: string;
    status: string;
  };
};

type BulkOrderFailureResult = {
  order_id: string;
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type BulkOrderItemResult = BulkOrderSuccessResult | BulkOrderFailureResult;

export type BulkOrderBatch = {
  batch_id: string;
  status: BulkOrderStatus;
  total: number;
  completed: number;
  success: number;
  failed: number;
  results: BulkOrderItemResult[];
  created_at: string;
  updated_at: string;
};

export interface BulkOrderStatusStore {
  create(batch: BulkOrderBatch): Promise<void>;
  update(batch: BulkOrderBatch): Promise<void>;
  findByBatchId(batchId: string): Promise<BulkOrderBatch | null>;
  clear(): Promise<void> | void;
}

export class BatchNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'BATCH_NOT_FOUND';

  constructor(batchId: string) {
    super(`Bulk order batch not found: ${batchId}`);
    this.name = 'BatchNotFoundError';
  }
}

export class InMemoryBulkOrderStatusStore implements BulkOrderStatusStore {
  private readonly batches = new Map<string, BulkOrderBatch>();

  async create(batch: BulkOrderBatch) {
    this.batches.set(batch.batch_id, batch);
  }

  async update(batch: BulkOrderBatch) {
    this.batches.set(batch.batch_id, batch);
  }

  async findByBatchId(batchId: string) {
    return this.batches.get(batchId) ?? null;
  }

  clear() {
    this.batches.clear();
  }
}

export class RedisBulkOrderStatusStore implements BulkOrderStatusStore {
  private readonly ttlSeconds = 7 * 24 * 60 * 60;

  async create(batch: BulkOrderBatch) {
    await this.update(batch);
  }

  async update(batch: BulkOrderBatch) {
    await redis.set(this.key(batch.batch_id), JSON.stringify(batch), 'EX', this.ttlSeconds);
  }

  async findByBatchId(batchId: string) {
    const rawBatch = await redis.get(this.key(batchId));

    return rawBatch ? (JSON.parse(rawBatch) as BulkOrderBatch) : null;
  }

  async clear() {
    const keys = await redis.keys('bulk-order-batch:*');

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  private key(batchId: string) {
    return `bulk-order-batch:${batchId}`;
  }
}

export class BulkOrderService {
  constructor(
    private readonly statusStore: BulkOrderStatusStore,
    private readonly orderCreator: OrderService,
  ) {}

  async enqueueBulkCreate(payload: BulkCreateOrdersRequest, options: { requestId?: string } = {}) {
    const now = new Date().toISOString();
    const batch: BulkOrderBatch = {
      batch_id: randomUUID(),
      status: 'QUEUED',
      total: payload.orders.length,
      completed: 0,
      success: 0,
      failed: 0,
      results: [],
      created_at: now,
      updated_at: now,
    };

    await this.statusStore.create(batch);

    const jobData = {
      batchId: batch.batch_id,
      orders: payload.orders,
      requestId: options.requestId,
    };

    if (process.env.NODE_ENV === 'test') {
      await this.processBatch(jobData);
    } else {
      await enqueueBulkOrderJob(jobData);
    }

    return {
      batch_id: batch.batch_id,
      status: batch.status,
      total_orders: batch.total,
    };
  }

  async getBatch(batchId: string) {
    const batch = await this.statusStore.findByBatchId(batchId);

    if (!batch) {
      throw new BatchNotFoundError(batchId);
    }

    return batch;
  }

  async processBatch(jobData: BulkOrderJobData) {
    const batch = await this.getBatch(jobData.batchId);
    const processingBatch = {
      ...batch,
      status: 'PROCESSING' as const,
      updated_at: new Date().toISOString(),
    };

    await this.statusStore.update(processingBatch);

    const seenOrderIds = new Set<string>();
    const results = await Promise.all(
      jobData.orders.map(async (orderPayload) => {
        if (seenOrderIds.has(orderPayload.order_id)) {
          return buildBulkFailure(orderPayload.order_id, {
            code: 'DUPLICATE_ORDER_IN_BATCH',
            message: `Duplicate order in batch: ${orderPayload.order_id}`,
          });
        }

        seenOrderIds.add(orderPayload.order_id);

        try {
          const order = await this.orderCreator.createOrder(orderPayload, {
            requestId: jobData.requestId,
          });

          return {
            order_id: order.order_id,
            success: true,
            data: {
              courier_partner: order.courier_partner,
              courier_order_id: order.courier_order_id,
              awb_number: order.awb_number,
              status: order.status,
            },
          } satisfies BulkOrderSuccessResult;
        } catch (error) {
          logFailure('Bulk order item failed', error, {
            orderId: orderPayload.order_id,
            courierPartner: orderPayload.courier_partner,
            requestId: jobData.requestId,
          });

          return buildBulkFailure(orderPayload.order_id, normalizeBulkError(error));
        }
      }),
    );

    const success = results.filter((result) => result.success).length;
    const completedBatch: BulkOrderBatch = {
      ...processingBatch,
      status: 'COMPLETED',
      completed: results.length,
      success,
      failed: results.length - success,
      results,
      updated_at: new Date().toISOString(),
    };

    await this.statusStore.update(completedBatch);

    return completedBatch;
  }
}

function buildBulkFailure(
  orderId: string,
  error: { code: string; message: string; details?: unknown },
): BulkOrderFailureResult {
  return {
    order_id: orderId,
    success: false,
    error,
  };
}

function normalizeBulkError(error: unknown) {
  if (error instanceof DuplicateOrderError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof UnknownCourierError) {
    return {
      code: error.code,
      message: error.message,
      details: {
        supported_couriers: error.supportedCouriers,
      },
    };
  }

  return {
    code: 'ORDER_CREATE_FAILED',
    message: 'Order could not be created',
  };
}

export const bulkOrderStatusStore =
  process.env.NODE_ENV === 'test'
    ? new InMemoryBulkOrderStatusStore()
    : new RedisBulkOrderStatusStore();

export const bulkOrderService = new BulkOrderService(bulkOrderStatusStore, orderService);
