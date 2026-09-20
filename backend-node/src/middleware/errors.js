import multer from 'multer';
import { Prisma } from '@prisma/client';
import { ApiError } from '../lib/http.js';
import { DEBUG } from '../config.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ detail: 'Not found.' });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
export function errorHandler(error, req, res, next) {
  if (error instanceof ApiError) {
    res.status(error.status).json(error.body);
    return;
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE' ? 'The submitted file is too large.' : `Upload failed: ${error.message}`;
    res.status(400).json({ [error.field || 'image']: [message] });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const fields = error.meta?.target ?? ['non_field_errors'];
      const body = {};
      for (const field of [].concat(fields)) body[field] = ['This field must be unique.'];
      res.status(400).json(body);
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({ detail: 'Not found.' });
      return;
    }
    if (error.code === 'P2003') {
      res.status(400).json({ detail: 'Invalid relation: the referenced record does not exist.' });
      return;
    }
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ detail: 'Malformed JSON in request body.' });
    return;
  }

  console.error('[error]', error);
  res.status(500).json({
    detail: 'A server error occurred.',
    ...(DEBUG ? { error: error.message, stack: error.stack } : {}),
  });
}
