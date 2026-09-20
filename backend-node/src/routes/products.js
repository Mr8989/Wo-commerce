import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler, notFound, ApiError } from '../lib/http.js';
import { paginationFor } from '../lib/pagination.js';
import { serializeProduct } from '../lib/serializers.js';
import { toId } from '../lib/ids.js';
import { validate, str, decimalString, integer, boolean, jsonArray, z } from '../lib/parse.js';
import { productImageUpload, storedPath, discardUpload } from '../lib/upload.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const SLUG = /^[-a-zA-Z0-9_]+$/;

const productSchema = z.object({
  name: str({ max: 200 }),
  slug: str({ max: 50 }).refine((value) => SLUG.test(value), 'Enter a valid "slug" consisting of letters, numbers, underscores or hyphens.'),
  description: str(),
  price: decimalString(),
  category: integer(),
  image_url: str({ max: 200, allowBlank: true }).nullable().optional(),
  stock: integer().optional(),
  available_sizes: jsonArray().optional(),
  is_featured: boolean().optional(),
  is_active: boolean().optional(),
});

/** Map validated request fields onto Prisma model fields, skipping absentees. */
function toModel(data, file) {
  const model = {};
  if (data.name !== undefined) model.name = data.name;
  if (data.slug !== undefined) model.slug = data.slug;
  if (data.description !== undefined) model.description = data.description;
  if (data.price !== undefined) model.price = data.price;
  if (data.category !== undefined) model.categoryId = BigInt(data.category);
  if (data.stock !== undefined) model.stock = data.stock;
  if (data.available_sizes !== undefined) model.availableSizes = data.available_sizes;
  if (data.is_featured !== undefined) model.isFeatured = data.is_featured;
  if (data.is_active !== undefined) model.isActive = data.is_active;
  if (data.image_url !== undefined) model.imageUrl = data.image_url || null;
  // An uploaded file replaces the stored path; the old file is left on disk,
  // exactly as Django's FileField did.
  if (file) model.image = storedPath(file);
  return model;
}

async function assertCategoryExists(categoryId) {
  if (categoryId === undefined) return;
  const exists = await prisma.category.findUnique({ where: { id: BigInt(categoryId) }, select: { id: true } });
  if (!exists) {
    throw new ApiError(400, { category: [`Invalid pk "${categoryId}" - object does not exist.`] });
  }
}

/** Django's ProductViewSet.get_object: numeric lookups by id, everything else by slug. */
async function getProduct(req) {
  const lookup = String(req.params.pk ?? '');
  const id = toId(lookup);

  const product = await prisma.product.findUnique({
    where: id === null ? { slug: lookup } : { id },
    include: { category: true },
  });

  if (!product) throw notFound('Product');
  return product;
}

router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
      take: 8,
    });

    // Not paginated, matching the Django @action's plain list response.
    res.json(products.map((product) => serializeProduct(product, req)));
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, search, featured, sort } = req.query;

    const where = {};
    if (category) where.category = { slug: String(category) };
    if (featured) where.isFeatured = true;
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const orderBy =
      { price_low: { price: 'asc' }, price_high: { price: 'desc' }, newest: { createdAt: 'desc' } }[String(sort ?? '')] ??
      { createdAt: 'desc' };

    const total = await prisma.product.count({ where });
    const { skip, take, envelope } = paginationFor(req, total);

    const products = await prisma.product.findMany({ where, orderBy, include: { category: true }, skip, take });

    res.json(envelope(products.map((product) => serializeProduct(product, req))));
  }),
);

// Mutations are admin-only. requireAdmin runs before multer so an
// unauthenticated upload never touches the disk.
router.post(
  '/',
  requireAdmin,
  productImageUpload.single('image'),
  asyncHandler(async (req, res) => {
    try {
      const data = validate(productSchema, req.body);
      await assertCategoryExists(data.category);

      const product = await prisma.product.create({
        data: toModel(data, req.file),
        include: { category: true },
      });

      res.status(201).json(serializeProduct(product, req));
    } catch (error) {
      await discardUpload(req.file);
      throw error;
    }
  }),
);

router.get(
  '/:pk',
  asyncHandler(async (req, res) => {
    res.json(serializeProduct(await getProduct(req), req));
  }),
);

const update = (partial) =>
  asyncHandler(async (req, res) => {
    try {
      const existing = await getProduct(req);
      const data = validate(productSchema, req.body, { partial });
      await assertCategoryExists(data.category);

      const product = await prisma.product.update({
        where: { id: existing.id },
        data: toModel(data, req.file),
        include: { category: true },
      });

      res.json(serializeProduct(product, req));
    } catch (error) {
      await discardUpload(req.file);
      throw error;
    }
  });

router.put('/:pk', requireAdmin, productImageUpload.single('image'), update(false));
router.patch('/:pk', requireAdmin, productImageUpload.single('image'), update(true));

router.delete(
  '/:pk',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await getProduct(req);
    await prisma.product.delete({ where: { id: existing.id } });
    res.status(204).end();
  }),
);

export default router;
