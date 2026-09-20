import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../db.js';
import config from '../config.js';
import { asyncHandler, ApiError } from '../lib/http.js';
import { serializeAdminUser } from '../lib/serializers.js';
import { bearerToken, tokenIsValid } from '../middleware/auth.js';
import { checkPassword, makePassword } from '../lib/django-password.js';
import { validate, str, z } from '../lib/parse.js';
import { sendMail } from '../services/mailer.js';
import { verificationCodeEmail, passwordChangedEmail } from '../services/templates.js';

const router = Router();

// Per-IP ceiling on credential endpoints, on top of the per-account lockout
// below. django-axes played this role in the Django stack.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

const loginSchema = z.object({
  username: str({ max: 150 }),
  password: str({ max: 128 }),
});

const changePasswordSchema = z.object({
  current_password: str({ max: 128 }),
  new_password: str({ max: 128 })
    .refine((value) => value.length >= 8, 'Password must be at least 8 characters long')
    .refine((value) => /[A-Z]/.test(value), 'Password must contain at least one uppercase letter')
    .refine((value) => /[a-z]/.test(value), 'Password must contain at least one lowercase letter')
    .refine((value) => /\d/.test(value), 'Password must contain at least one number'),
});

const issueToken = () => crypto.randomBytes(32).toString('base64url');

router.post(
  '/login',
  credentialLimiter,
  asyncHandler(async (req, res) => {
    let credentials;
    try {
      credentials = validate(loginSchema, req.body);
    } catch {
      throw new ApiError(400, { error: 'Invalid input' });
    }

    const admin = await prisma.adminUser.findFirst({ where: { username: credentials.username, isActive: true } });

    // Same response for an unknown username as for a wrong password, so the
    // endpoint doesn't confirm which accounts exist.
    if (!admin) throw new ApiError(401, { error: 'Invalid credentials' });

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      throw new ApiError(429, {
        error: 'Account temporarily locked due to too many failed attempts. Try again later.',
      });
    }

    if (!(await checkPassword(credentials.password, admin.password))) {
      const attempts = admin.failedLoginAttempts + 1;
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: attempts >= config.auth.failureLimit ? new Date(Date.now() + config.auth.lockoutMs) : null,
        },
      });
      throw new ApiError(401, { error: 'Invalid credentials' });
    }

    const token = issueToken();
    const updated = await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
        authToken: token,
        tokenCreatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: serializeAdminUser(updated),
      token,
    });
  }),
);

router.get(
  '/verify',
  asyncHandler(async (req, res) => {
    const token = bearerToken(req);
    if (!token) throw new ApiError(401, { error: 'No token provided' });

    const admin = await prisma.adminUser.findFirst({ where: { authToken: token, isActive: true } });
    if (!admin) throw new ApiError(401, { error: 'Invalid token' });
    if (!tokenIsValid(admin)) throw new ApiError(401, { error: 'Token expired' });

    res.json({ success: true, user: serializeAdminUser(admin) });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = bearerToken(req);
    if (token) {
      await prisma.adminUser.updateMany({
        where: { authToken: token },
        data: { authToken: null, tokenCreatedAt: null },
      });
    }
    res.json({ success: true });
  }),
);

router.post(
  '/request-password-change',
  credentialLimiter,
  asyncHandler(async (req, res) => {
    const username = req.body?.username ? String(req.body.username) : '';
    const currentPassword = req.body?.current_password ? String(req.body.current_password) : '';

    const admin = await prisma.adminUser.findFirst({ where: { username, isActive: true } });
    if (!admin) throw new ApiError(404, { error: 'Admin user not found' });

    if (!(await checkPassword(currentPassword, admin.password))) {
      throw new ApiError(400, { error: 'Current password is incorrect' });
    }

    if (!admin.email) {
      throw new ApiError(400, { error: 'No email address on file. Please contact system administrator.' });
    }

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        verificationCode: code,
        verificationCodeExpires: new Date(Date.now() + config.auth.verificationCodeTtlMs),
        verificationCodeUsed: false,
      },
    });

    const { subject, text, html } = verificationCodeEmail(admin, code);
    try {
      await sendMail({ to: admin.email, subject, text, html });
    } catch {
      throw new ApiError(500, { error: 'Failed to send verification email. Please try again.' });
    }

    res.json({
      success: true,
      message: `Verification code sent to ${admin.email}`,
      email: admin.email,
    });
  }),
);

router.post(
  '/verify-change-password',
  credentialLimiter,
  asyncHandler(async (req, res) => {
    let passwords;
    try {
      passwords = validate(changePasswordSchema, req.body);
    } catch (error) {
      // The Django view nested serializer errors under an "errors" key.
      throw new ApiError(400, { errors: error.body });
    }

    const username = req.body?.username ? String(req.body.username) : '';
    const submittedCode = req.body?.verification_code ? String(req.body.verification_code) : '';

    const admin = await prisma.adminUser.findFirst({ where: { username, isActive: true } });
    if (!admin) throw new ApiError(404, { error: 'Admin user not found' });

    if (!(await checkPassword(passwords.current_password, admin.password))) {
      throw new ApiError(400, { error: 'Current password is incorrect' });
    }

    if (!admin.verificationCode) {
      throw new ApiError(400, { error: 'No verification code found. Please request a new one.' });
    }
    if (admin.verificationCodeUsed) {
      throw new ApiError(400, { error: 'Verification code already used. Please request a new one.' });
    }
    if (!admin.verificationCodeExpires || admin.verificationCodeExpires < new Date()) {
      throw new ApiError(400, { error: 'Verification code expired. Please request a new one.' });
    }
    if (!timingSafeEquals(admin.verificationCode, submittedCode)) {
      throw new ApiError(400, { error: 'Invalid verification code' });
    }
    if (passwords.current_password === passwords.new_password) {
      throw new ApiError(400, { error: 'New password must be different from current password' });
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        password: await makePassword(passwords.new_password),
        verificationCodeUsed: true,
      },
    });

    const { subject, text, html } = passwordChangedEmail(admin);
    await sendMail({ to: admin.email, subject, text, html, failSilently: true });

    res.json({ success: true, message: 'Password changed successfully' });
  }),
);

function timingSafeEquals(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export default router;
