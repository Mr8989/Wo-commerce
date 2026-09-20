import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../db.js';
import { asyncHandler, notFound, ApiError } from '../lib/http.js';
import { paginationFor } from '../lib/pagination.js';
import { serializeOrder } from '../lib/serializers.js';
import { toId } from '../lib/ids.js';
import { validate, str, decimalString, integer, z } from '../lib/parse.js';
import { sendOrderNotifications, sendStatusUpdateSms } from '../services/notifications.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Every order fires a paid SMS and an email, so cap how fast one address can
// place them. Real shoppers never come close to this.
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many orders from this address. Please try again later.' },
});

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_METHODS = ['bank_transfer', 'mobile_money', 'cash_on_delivery'];

const choice = (values) =>
  z.preprocess(
    (value) => (value === undefined || value === null ? value : String(value)),
    z.enum(values, { errorMap: (issue) => ({ message: `"${issue.received}" is not a valid choice.` }) }),
  );

const orderSchema = z.object({
  email: z.string().email('Enter a valid email address.').max(254),
  first_name: str({ max: 100 }),
  last_name: str({ max: 100 }),
  phone: str({ max: 20 }),
  delivery_address: str({ max: 255 }),
  delivery_city: str({ max: 100 }),
  delivery_state: str({ max: 100 }),
  delivery_postal_code: str({ max: 20 }),
  delivery_country: str({ max: 100 }),
  total_amount: decimalString(),
  status: choice(STATUSES).optional(),
  payment_method: choice(PAYMENT_METHODS).optional(),
  notes: str({ allowBlank: true }).optional(),
});

// Customers can't pick their own status or total; the admin PATCH schema
// still can. `total_amount` is accepted from older clients but recomputed.
const checkoutSchema = orderSchema.omit({ status: true }).extend({ total_amount: decimalString().optional() });

// `price` is still accepted for backwards compatibility but ignored: the
// server prices every line from the products table.
const itemSchema = z.object({
  product_id: integer(),
  quantity: integer({ min: 1 }).default(1),
  size: str({ max: 10, allowBlank: true }).default(''),
  price: decimalString().optional(),
});

const MAX_ITEMS_PER_ORDER = 50;

const withItems = { items: { include: { product: true } } };

function toModel(data) {
  const model = {};
  const map = {
    email: 'email',
    first_name: 'firstName',
    last_name: 'lastName',
    phone: 'phone',
    delivery_address: 'deliveryAddress',
    delivery_city: 'deliveryCity',
    delivery_state: 'deliveryState',
    delivery_postal_code: 'deliveryPostalCode',
    delivery_country: 'deliveryCountry',
    total_amount: 'totalAmount',
    status: 'status',
    payment_method: 'paymentMethod',
    notes: 'notes',
  };
  for (const [field, column] of Object.entries(map)) {
    if (data[field] !== undefined) model[column] = data[field];
  }
  return model;
}

/** Django's Order.save(): WW + UTC date + 8 hex characters. */
const buildOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `WW${date}${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
};

async function getOrder(req) {
  const id = toId(req.params.pk);
  const order = id === null ? null : await prisma.order.findUnique({ where: { id }, include: withItems });
  if (!order) throw notFound('Order');
  return order;
}

router.get(
  '/stats',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [total, pending, processing, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'processing' } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
    ]);

    res.json({
      total_orders: total,
      pending_orders: pending,
      processing_orders: processing,
      total_revenue: Number(revenue._sum.totalAmount ?? 0),
    });
  }),
);

// Customer-facing lookup by the exact order number printed on the receipt.
// Numbers carry 32 bits of randomness, so guessing one is impractical.
router.get(
  '/track/:orderNumber',
  asyncHandler(async (req, res) => {
    const orderNumber = String(req.params.orderNumber ?? '').trim().toUpperCase();
    const order = orderNumber
      ? await prisma.order.findUnique({ where: { orderNumber }, include: withItems })
      : null;
    if (!order) throw notFound('Order');
    res.json(serializeOrder(order, req));
  }),
);

router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.search) where.orderNumber = { contains: String(req.query.search), mode: 'insensitive' };

    const total = await prisma.order.count({ where });
    const { skip, take, envelope } = paginationFor(req, total);

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: withItems,
      skip,
      take,
    });

    res.json(envelope(orders.map((order) => serializeOrder(order, req))));
  }),
);

router.post(
  '/',
  checkoutLimiter,
  asyncHandler(async (req, res) => {
    const data = validate(checkoutSchema, req.body);
    const items = z.array(itemSchema).min(1, 'An order needs at least one item.').max(MAX_ITEMS_PER_ORDER).safeParse(req.body?.items ?? []);
    if (!items.success) {
      throw new ApiError(400, { items: items.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) });
    }

    const productIds = [...new Set(items.data.map((item) => BigInt(item.product_id)))];
    const known = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true },
    });
    if (known.length !== productIds.length) {
      const found = new Set(known.map((product) => String(product.id)));
      const missing = productIds.filter((id) => !found.has(String(id))).map(Number);
      throw new ApiError(400, { items: [`Invalid product_id(s): ${missing.join(', ')}`] });
    }

    // Never trust prices from the browser: charge what the catalogue says.
    const priceOf = new Map(known.map((product) => [String(product.id), Number(product.price)]));
    const lines = items.data.map((item) => ({
      productId: BigInt(item.product_id),
      quantity: item.quantity,
      size: item.size,
      price: priceOf.get(String(item.product_id)).toFixed(2),
    }));
    const totalAmount = lines.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0).toFixed(2);

    // The fingerprint links repeat visitors to their orders, the same way the
    // Django view's get_or_create did.
    const fingerprint = req.body?.fingerprint ? String(req.body.fingerprint) : null;
    let anonymousUser = null;
    if (fingerprint) {
      anonymousUser = await prisma.anonymousUser.upsert({
        where: { fingerprint },
        update: {},
        create: {
          fingerprint,
          email: data.email ?? null,
          firstName: data.first_name ?? '',
          lastName: data.last_name ?? '',
          phone: data.phone ?? '',
        },
      });
    }

    const order = await createOrderWithUniqueNumber({
      ...toModel(data),
      totalAmount,
      anonymousUserId: anonymousUser?.id ?? null,
      items: { create: lines },
    });

    if (anonymousUser) {
      await prisma.cartItem.deleteMany({ where: { anonymousUserId: anonymousUser.id } });
    }

    await sendOrderNotifications(order).catch((error) => console.error('[orders] notification error:', error));

    res.status(201).json(serializeOrder(order, req));
  }),
);

/** Retry on the (very unlikely) order-number collision rather than 500-ing. */
async function createOrderWithUniqueNumber(data, attempts = 5) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await prisma.order.create({
        data: { ...data, orderNumber: buildOrderNumber() },
        include: withItems,
      });
    } catch (error) {
      const collision = error?.code === 'P2002' && [].concat(error.meta?.target ?? []).includes('order_number');
      if (!collision || attempt >= attempts) throw error;
    }
  }
}

router.get(
  '/:pk',
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(serializeOrder(await getOrder(req), req));
  }),
);

const update = (partial) =>
  asyncHandler(async (req, res) => {
    const existing = await getOrder(req);
    const data = validate(orderSchema, req.body, { partial });

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: toModel(data),
      include: withItems,
    });

    if (data.status && data.status !== existing.status) {
      await sendStatusUpdateSms(order, data.status).catch((error) =>
        console.error('[orders] status SMS error:', error),
      );
    }

    res.json(serializeOrder(order, req));
  });

router.put('/:pk', requireAdmin, update(false));
router.patch('/:pk', requireAdmin, update(true));

router.post(
  '/:pk/cancel',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await getOrder(req);

    if (!['pending', 'processing'].includes(existing.status)) {
      throw new ApiError(400, { error: `Cannot cancel order with status: ${existing.status}` });
    }

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: { status: 'cancelled' },
      include: withItems,
    });

    await sendStatusUpdateSms(order, 'cancelled').catch((error) =>
      console.error('[orders] cancellation SMS error:', error),
    );

    res.json({ message: 'Order cancelled successfully', order: serializeOrder(order, req) });
  }),
);

router.delete(
  '/:pk',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await getOrder(req);
    await prisma.order.delete({ where: { id: existing.id } });
    res.status(204).end();
  }),
);

export default router;
