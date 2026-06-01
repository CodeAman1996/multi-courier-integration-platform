import { Worker } from 'bullmq';

import { BULK_ORDER_QUEUE_NAME, type BulkOrderJobData } from '../queues/bulk-order.queue.js';
import { getRedisConnectionOptions } from '../redis/client.js';
import { bulkOrderService } from '../services/bulk-order.service.js';
import { logger } from '../utils/logger.js';

export function startBulkOrderWorker() {
  const worker = new Worker<BulkOrderJobData>(
    BULK_ORDER_QUEUE_NAME,
    async (job) => {
      logger.info('Processing bulk order job', {
        job_id: job.id,
        batch_id: job.data.batchId,
        request_id: job.data.requestId,
        total_orders: job.data.orders.length,
      });

      return bulkOrderService.processBatch(job.data);
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency: 3,
    },
  );

  worker.on('completed', (job) => {
    logger.info('Bulk order job completed', {
      job_id: job.id,
      batch_id: job.data.batchId,
      request_id: job.data.requestId,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Bulk order job failed', {
      job_id: job?.id,
      batch_id: job?.data.batchId,
      request_id: job?.data.requestId,
      error,
    });
  });

  return worker;
}
