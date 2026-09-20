import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler, notFound } from '../lib/http.js';
import { paginationFor } from '../lib/pagination.js';
import { serializeCategory } from '../lib/serializers.js';
import { toId } from '../lib/ids.js';
import { validate, str, z } from '../lib/parse.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const SLUG = /^[-a-zA-Z0-9_]+$/;

const categorySchema = z.object({
  name: str({ max: 100 }),
  slug: str({ max: 50 }).refine((value) => SLUG.test(value), 'Enter a valid "slug" consisting of letters, numbers, underscores or hyphens.'),
  description: str({ allowBlank: true }).default(''),
});

// Counting only active products matches the Django serializer's product_count.
const withProductCount = { _count: { select: { products: { where: { isActive: true } } } } };

const toModel = (data) => ({
  ...(data.name !== undefined && { name: data.name }),
  ...(data.slug !== undefined && { slug: data.slug }),
  ...(data.description !== undefined && { description: data.description }),
});

async function getCategory(req) {
  const id = toId(req.params.pk);
  const category = id === null ? null : await prisma.category.findUnique({ where: { id }, include: withProductCount });
  if (!category) throw notFound('Category');
  return category;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const total = await prisma.category.count();
    const { skip, take, envelope } = paginationFor(req, total);

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: withProductCount,
      skip,
      take,
    });

    res.json(envelope(categories.map((category) => serializeCategory(category))));
  }),
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = validate(categorySchema, req.body);
    const category = await prisma.category.create({ data: toModel(data), include: withProductCount });
    res.status(201).json(serializeCategory(category));
  }),
);

router.get(
  '/:pk',
  asyncHandler(async (req, res) => {
    res.json(serializeCategory(await getCategory(req)));
  }),
);

const update = (partial) =>
  asyncHandler(async (req, res) => {
    const existing = await getCategory(req);
    const data = validate(categorySchema, req.body, { partial });

    const category = await prisma.category.update({
      where: { id: existing.id },
      data: toModel(data),
      include: withProductCount,
    });

    res.json(serializeCategory(category));
  });

router.put('/:pk', requireAdmin, update(false));
router.patch('/:pk', requireAdmin, update(true));

router.delete(
  '/:pk',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await getCategory(req);
    // Django cascades category -> products -> order/cart items in Python;
    // relationMode="prisma" makes Prisma do the same here.
    await prisma.category.delete({ where: { id: existing.id } });
    res.status(204).end();
  }),
);

export default router;
