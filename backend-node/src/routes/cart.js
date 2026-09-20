import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler, notFound, ApiError } from '../lib/http.js';
import { paginationFor } from '../lib/pagination.js';
import { serializeCartItem } from '../lib/serializers.js';
import { toId } from '../lib/ids.js';
import { validate, str, integer, z } from '../lib/parse.js';

// Server-side cart for anonymous visitors, keyed by browser fingerprint.
// The storefront currently keeps its cart in localStorage, so nothing calls
// these endpoints — they are kept working for parity with the Django API.
const router = Router();

const cartItemSchema = z.object({
  fingerprint: str({ max: 255 }),
  product_id: integer(),
  size: str({ max: 10, allowBlank: true }).default(''),
  quantity: integer({ min: 1 }).default(1),
});

const include = { product: { include: { category: true } } };

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const fingerprint = req.query.fingerprint ? String(req.query.fingerprint) : null;
    const user = fingerprint ? await prisma.anonymousUser.findUnique({ where: { fingerprint } }) : null;

    const where = user ? { anonymousUserId: user.id } : { id: { in: [] } };
    const total = user ? await prisma.cartItem.count({ where }) : 0;
    const { skip, take, envelope } = paginationFor(req, total);

    const items = total ? await prisma.cartItem.findMany({ where, include, skip, take }) : [];
    res.json(envelope(items.map((item) => serializeCartItem(item, req))));
  }),
);

router.post(
  '/clear',
  asyncHandler(async (req, res) => {
    const fingerprint = req.body?.fingerprint ? String(req.body.fingerprint) : null;
    const user = fingerprint ? await prisma.anonymousUser.findUnique({ where: { fingerprint } }) : null;

    if (!user) {
      res.json({ message: 'No cart found' });
      return;
    }

    await prisma.cartItem.deleteMany({ where: { anonymousUserId: user.id } });
    res.json({ message: 'Cart cleared' });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.body?.fingerprint) throw new ApiError(400, { error: 'Fingerprint is required' });

    const data = validate(cartItemSchema, req.body);

    const product = await prisma.product.findUnique({ where: { id: BigInt(data.product_id) }, select: { id: true } });
    if (!product) throw new ApiError(400, { product_id: [`Invalid pk "${data.product_id}" - object does not exist.`] });

    const user = await prisma.anonymousUser.upsert({
      where: { fingerprint: data.fingerprint },
      update: {},
      create: { fingerprint: data.fingerprint },
    });

    // Adding the same product and size again bumps the quantity.
    const item = await prisma.cartItem.upsert({
      where: {
        anonymousUserId_productId_size: {
          anonymousUserId: user.id,
          productId: product.id,
          size: data.size,
        },
      },
      update: { quantity: { increment: data.quantity } },
      create: { anonymousUserId: user.id, productId: product.id, size: data.size, quantity: data.quantity },
      include,
    });

    res.status(201).json(serializeCartItem(item, req));
  }),
);

async function getCartItem(req) {
  const id = toId(req.params.pk);
  const item = id === null ? null : await prisma.cartItem.findUnique({ where: { id }, include });
  if (!item) throw notFound('CartItem');
  return item;
}

const update = asyncHandler(async (req, res) => {
  const existing = await getCartItem(req);
  const data = validate(cartItemSchema.pick({ quantity: true, size: true }), req.body, { partial: true });

  const item = await prisma.cartItem.update({
    where: { id: existing.id },
    data: {
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.size !== undefined && { size: data.size }),
    },
    include,
  });

  res.json(serializeCartItem(item, req));
});

router.put('/:pk', update);
router.patch('/:pk', update);

router.delete(
  '/:pk',
  asyncHandler(async (req, res) => {
    const existing = await getCartItem(req);
    await prisma.cartItem.delete({ where: { id: existing.id } });
    res.status(204).end();
  }),
);

export default router;
