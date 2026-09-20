import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config, { DEBUG } from './config.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errors.js';

export function createApp() {
  const app = express();

  // nginx terminates TLS and forwards X-Forwarded-Proto; without this,
  // absolute media URLs would be built with http://.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // This is a JSON + image API consumed from another origin, so the
      // default same-origin resource policy would block product images.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  app.use(compression());

  app.use(
    cors({
      origin: config.cors.allowAllOrigins ? true : config.cors.allowedOrigins,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // In production nginx serves /media/ straight off disk and never reaches
  // this; it stays here so local development works without nginx.
  app.use(
    config.mediaUrl,
    express.static(config.mediaRoot, { maxAge: DEBUG ? 0 : '30d', fallthrough: true }),
  );

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
