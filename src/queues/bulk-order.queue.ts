import { Queue } from 'bullmq';

import type { CreateOrderRequest } from '../helpers/validation.helper.js';
import { getRedisConnectionOptions } from '../redis/client.js';

export const BULK_ORDER_QUEUE_NAME = 'bulk-order-create';

export type BulkOrderJobData = {
  batchId: string;
  orders: CreateOrderRequest[];
  requestId?: string;
};

export const bulkOrderQueue =
  process.env.NODE_ENV === 'test'
    ? null
    : new Queue(BULK_ORDER_QUEUE_NAME, {
        connection: getRedisConnectionOptions(),
      });

export async function enqueueBulkOrderJob(data: BulkOrderJobData) {
  await bulkOrderQueue?.add('create-orders', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  });
}
