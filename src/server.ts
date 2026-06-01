import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startBulkOrderWorker } from './workers/bulk-order.worker.js';

const app = createApp();
const bulkOrderWorker = process.env.NODE_ENV === 'test' ? null : startBulkOrderWorker();

const server = app.listen(env.PORT, () => {
  logger.info('HTTP server started', { port: env.PORT });
});

function shutdown(signal: NodeJS.Signals) {
  logger.info('Shutting down HTTP server', { signal });

  server.close((error) => {
    if (error) {
      logger.error('Error while shutting down HTTP server', { error });
      process.exit(1);
    }

    void bulkOrderWorker?.close().finally(() => {
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
