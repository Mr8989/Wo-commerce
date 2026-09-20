import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import config from '../config.js';
import { ApiError } from './http.js';

export const PRODUCT_UPLOAD_DIR = 'products'; // matches Django's upload_to='products/'

const RANDOM_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Django's get_valid_filename: spaces become underscores, odd characters go. */
export function validFilename(name) {
  const cleaned = String(name).trim().replace(/\s+/g, '_').replace(/[^-\w.]/g, '');
  return cleaned || 'file';
}

function randomSuffix(length = 7) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (const byte of bytes) out += RANDOM_CHARS[byte % RANDOM_CHARS.length];
  return out;
}

/**
 * Pick a filename that isn't taken yet, inserting a random suffix before the
 * extension on collision — the same scheme Django's FileSystemStorage uses,
 * so existing filenames like `image_ctWS7ZF.jpeg` stay consistent.
 */
async function availableName(dir, filename) {
  const ext = path.extname(filename);
  const stem = path.basename(filename, ext);

  let candidate = filename;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      await fsp.access(path.join(dir, candidate));
    } catch {
      return candidate;
    }
    candidate = `${stem}_${randomSuffix()}${ext}`;
  }
  throw new ApiError(500, 'Could not find an available filename for the upload.');
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(config.mediaRoot, PRODUCT_UPLOAD_DIR);
    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },
  filename(req, file, cb) {
    const dir = path.join(config.mediaRoot, PRODUCT_UPLOAD_DIR);
    availableName(dir, validFilename(file.originalname)).then((name) => cb(null, name), cb);
  },
});

export const productImageUpload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new ApiError(400, { image: ['Upload a valid image. The file you uploaded was either not an image or a corrupted image.'] }));
      return;
    }
    cb(null, true);
  },
});

/** The value stored in the database column, e.g. "products/dress.png". */
export const storedPath = (file) => `${PRODUCT_UPLOAD_DIR}/${file.filename}`;

/** Remove a just-saved upload after a failed request, so it isn't orphaned. */
export async function discardUpload(file) {
  if (!file) return;
  await fsp.rm(file.path, { force: true }).catch(() => {});
}
