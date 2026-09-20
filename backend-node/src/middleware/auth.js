import prisma from '../db.js';
import config from '../config.js';
import { ApiError, asyncHandler } from '../lib/http.js';

export const bearerToken = (req) => (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '').trim();

export const tokenIsValid = (admin) =>
  Boolean(
    admin.authToken &&
      admin.tokenCreatedAt &&
      Date.now() - admin.tokenCreatedAt.getTime() < config.auth.tokenLifetimeMs,
  );

/**
 * Require a valid admin bearer token (issued by POST /api/admin/login/).
 * The matching admin row is exposed as `req.admin` for the handler.
 */
export const requireAdmin = asyncHandler(async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) throw new ApiError(401, { error: 'Authentication required' });

  const admin = await prisma.adminUser.findFirst({ where: { authToken: token, isActive: true } });
  if (!admin) throw new ApiError(401, { error: 'Invalid token' });
  if (!tokenIsValid(admin)) throw new ApiError(401, { error: 'Token expired' });

  req.admin = admin;
  next();
});
