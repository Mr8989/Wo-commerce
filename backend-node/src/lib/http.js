/** Wraps an async route handler so rejections reach Express' error handler. */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/** An error with an HTTP status and a JSON body, shaped like DRF's responses. */
export class ApiError extends Error {
  constructor(status, body) {
    super(typeof body === 'string' ? body : JSON.stringify(body));
    this.status = status;
    this.body = typeof body === 'string' ? { detail: body } : body;
  }
}

export const notFound = (modelName) =>
  new ApiError(404, { detail: `No ${modelName} matches the given query.` });

export const badRequest = (body) => new ApiError(400, body);
