import config from '../config.js';
import { ApiError } from './http.js';

/**
 * Mirrors DRF's PageNumberPagination: a `{count, next, previous, results}`
 * envelope with a fixed page size and a `?page=` query parameter.
 */
export function paginationFor(req, total) {
  const pageSize = config.pageSize;
  const raw = req.query.page ?? '1';
  const page = Number(raw);

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(404, { detail: 'Invalid page.' });
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (page > pageCount && total > 0) {
    throw new ApiError(404, { detail: 'Invalid page.' });
  }

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    envelope: (results) => ({
      count: total,
      next: page < pageCount ? pageUrl(req, page + 1) : null,
      previous: page > 1 ? pageUrl(req, page === 2 ? null : page - 1) : null,
      results,
    }),
  };
}

function pageUrl(req, page) {
  const url = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);
  if (page === null) url.searchParams.delete('page');
  else url.searchParams.set('page', String(page));
  return url.toString();
}
