import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'HTTP server started');
});

function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'Shutting down HTTP server');

  server.close((error) => {
    if (error) {
      logger.error({ error }, 'Error while shutting down HTTP server');
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
