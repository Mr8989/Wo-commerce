import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const bool = (value, fallback = false) =>
  value === undefined ? fallback : ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());

const list = (value) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const DEBUG = bool(process.env.DEBUG);

// Prisma reads DATABASE_URL from the environment. Accept either that, or the
// individual DATABASE_* variables the Django backend used, so an existing
// .env keeps working.
if (!process.env.DATABASE_URL) {
  const { DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT } = process.env;
  if (!DATABASE_NAME || !DATABASE_USER) {
    throw new Error('Set DATABASE_URL (or DATABASE_NAME/DATABASE_USER/DATABASE_PASSWORD/DATABASE_HOST/DATABASE_PORT)');
  }
  const auth = `${encodeURIComponent(DATABASE_USER)}:${encodeURIComponent(DATABASE_PASSWORD ?? '')}`;
  const host = `${DATABASE_HOST || '127.0.0.1'}:${DATABASE_PORT || 5432}`;
  process.env.DATABASE_URL = `postgresql://${auth}@${host}/${DATABASE_NAME}`;
}

export const config = {
  debug: DEBUG,
  port: Number(process.env.PORT || 8000),
  host: process.env.HOST || '127.0.0.1',

  // Public origin of the site, used to build links inside emails and SMS.
  siteUrl: (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),

  // Uploaded product images. Point this at the Django backend's media
  // directory (or a copy of it) so existing image rows keep resolving.
  mediaRoot: path.resolve(ROOT_DIR, process.env.MEDIA_ROOT || 'media'),
  mediaUrl: '/media/',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),

  // When CLOUDINARY_URL is set, uploads go to Cloudinary instead of the local
  // media directory. Needed on hosts whose disk is wiped on every restart.
  cloudinary: {
    enabled: Boolean(process.env.CLOUDINARY_URL),
    folder: process.env.CLOUDINARY_FOLDER || 'croppedbyayerkie/products',
  },

  pageSize: Number(process.env.PAGE_SIZE || 12),

  cors: {
    allowAllOrigins: DEBUG,
    allowedOrigins: list(process.env.CORS_ALLOWED_ORIGINS),
  },

  auth: {
    tokenLifetimeMs: Number(process.env.ADMIN_TOKEN_LIFETIME_HOURS || 24) * 60 * 60 * 1000,
    failureLimit: Number(process.env.LOGIN_FAILURE_LIMIT || 5),
    lockoutMs: Number(process.env.LOGIN_LOCKOUT_MINUTES || 15) * 60 * 1000,
    verificationCodeTtlMs: Number(process.env.VERIFICATION_CODE_MINUTES || 10) * 60 * 1000,
    // Matches the Django version that produced the hashes already in the
    // database. Verification reads the count out of each stored hash, so this
    // only affects newly set passwords.
    pbkdf2Iterations: Number(process.env.PBKDF2_ITERATIONS || 720_000),
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 587),
    useTls: bool(process.env.EMAIL_USE_TLS, true),
    user: process.env.EMAIL_HOST_USER || '',
    password: process.env.EMAIL_HOST_PASSWORD || '',
    from: process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER || '',
    adminEmail: process.env.ADMIN_EMAIL || process.env.EMAIL_HOST_USER || '',
  },

  sms: {
    username: process.env.AFRICAS_TALKING_USERNAME || 'sandbox',
    apiKey: process.env.AFRICAS_TALKING_API_KEY || '',
    senderId: process.env.AFRICAS_TALKING_SENDER_ID || '',
  },

  supportPhone: process.env.SUPPORT_PHONE_NUMBER || '+233 24 123 4567',
};

export default config;
