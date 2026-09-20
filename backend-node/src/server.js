import { createApp } from './app.js';
import config from './config.js';
import prisma from './db.js';

const app = createApp();
const server = app.listen(config.port, config.host, () => {
  console.log(`[api] listening on http://${config.host}:${config.port} (debug=${config.debug})`);
  console.log(`[api] serving media from ${config.mediaRoot}`);
});

async function shutdown(signal) {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Don't hang forever on a stuck connection.
  setTimeout(() => process.exit(1), 10_000).unref();
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => void shutdown(signal));
}
