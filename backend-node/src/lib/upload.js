import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import config from '../config.js';
import { ApiError, asyncHandler } from './http.js';

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

const INVALID_IMAGE = () =>
  new ApiError(400, { image: ['Upload a valid image. The file you uploaded was either not an image or a corrupted image.'] });

// Uploads are held in memory (capped at maxUploadBytes) so they can be
// resized before anything is written to disk.
export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(INVALID_IMAGE());
      return;
    }
    cb(null, true);
  },
});

// Phone photos arrive at 4000px / several MB; the product grid needs ~800px.
// Everything is stored as WebP within this box, which is ~80-90% smaller and
// is what the storefront serves to every visitor.
const MAX_DIMENSION = Number(process.env.IMAGE_MAX_DIMENSION || 1200);
const WEBP_QUALITY = Number(process.env.IMAGE_WEBP_QUALITY || 82);

// The SDK reads CLOUDINARY_URL (cloudinary://key:secret@cloud) from the
// environment, which config.js has already populated from .env.
if (config.cloudinary.enabled) cloudinary.config({ secure: true });

function uploadToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: config.cloudinary.folder, public_id: publicId, resource_type: 'image', overwrite: false },
        (error, result) => (error ? reject(error) : resolve(result)),
      )
      .end(buffer);
  });
}

/**
 * Runs after multer: decodes the upload (rejecting anything that isn't really
 * an image, whatever its declared type), resizes it and writes it to the
 * media directory. Leaves `req.file.filename` / `req.file.path` set the way
 * disk storage would have, so the route code doesn't care which path ran.
 */
export const processProductImage = asyncHandler(async (req, res, next) => {
  const file = req.file;
  if (!file) {
    next();
    return;
  }

  let output;
  try {
    // Animated GIFs keep their frames; `rotate()` applies the EXIF orientation
    // phones record instead of storing the pixels sideways.
    const animated = file.mimetype === 'image/gif';
    output = await sharp(file.buffer, { animated, failOn: 'error' })
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();
  } catch {
    throw INVALID_IMAGE();
  }

  const stem = path.basename(validFilename(file.originalname), path.extname(file.originalname));
  file.size = output.length;
  file.mimetype = 'image/webp';
  delete file.buffer;

  if (config.cloudinary.enabled) {
    const result = await uploadToCloudinary(output, `${stem}_${randomSuffix()}`);
    file.filename = result.public_id;
    file.path = result.secure_url;
    file.cloudinaryId = result.public_id;
    next();
    return;
  }

  const dir = path.join(config.mediaRoot, PRODUCT_UPLOAD_DIR);
  await fsp.mkdir(dir, { recursive: true });

  const filename = await availableName(dir, `${stem}.webp`);
  const destination = path.join(dir, filename);
  await fsp.writeFile(destination, output);

  file.filename = filename;
  file.path = destination;

  next();
});

/**
 * The value stored in the database column: "products/dress.webp" for a local
 * file, or the full https URL for a Cloudinary upload.
 */
export const storedPath = (file) => (file.cloudinaryId ? file.path : `${PRODUCT_UPLOAD_DIR}/${file.filename}`);

/** Remove a just-saved upload after a failed request, so it isn't orphaned. */
export async function discardUpload(file) {
  if (!file) return;
  if (file.cloudinaryId) {
    await cloudinary.uploader.destroy(file.cloudinaryId).catch(() => {});
    return;
  }
  await fsp.rm(file.path, { force: true }).catch(() => {});
}
