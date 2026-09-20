import config from '../config.js';
import { fromId } from './ids.js';

/** DRF renders DecimalField as a string with the field's decimal_places. */
const decimal = (value) => (value === null || value === undefined ? null : Number(value).toFixed(2));

/** DRF renders DateTimeField as ISO-8601 with a trailing Z. */
const datetime = (value) => (value ? new Date(value).toISOString() : null);

/** Absolute URL for a stored media path, e.g. "products/dress.png". */
export function mediaUrl(req, relativePath) {
  if (!relativePath) return null;
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}${config.mediaUrl}${String(relativePath).replace(/^\/+/, '')}`;
}

export function serializeCategory(category, { productCount = null } = {}) {
  return {
    id: fromId(category.id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    product_count: productCount ?? category._count?.products ?? 0,
    created_at: datetime(category.createdAt),
  };
}

export function serializeProduct(product, req) {
  const uploaded = product.image ? mediaUrl(req, product.image) : null;
  return {
    id: fromId(product.id),
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: decimal(product.price),
    category: fromId(product.categoryId),
    category_name: product.category?.name ?? null,
    image: uploaded,
    image_url: product.imageUrl,
    // Uploaded file wins over the pasted URL, matching the Django serializer.
    image_display: uploaded ?? product.imageUrl,
    stock: product.stock,
    available_sizes: product.availableSizes ?? [],
    is_featured: product.isFeatured,
    is_active: product.isActive,
    created_at: datetime(product.createdAt),
    updated_at: datetime(product.updatedAt),
  };
}

export function serializeOrderItem(item, req) {
  const product = item.product;
  return {
    id: fromId(item.id),
    product: fromId(item.productId),
    product_name: product?.name ?? null,
    product_image: product?.image ? mediaUrl(req, product.image) : (product?.imageUrl ?? null),
    quantity: item.quantity,
    size: item.size,
    price: decimal(item.price),
    total_price: Number((Number(item.price) * item.quantity).toFixed(2)),
  };
}

export function serializeOrder(order, req) {
  return {
    id: fromId(order.id),
    order_number: order.orderNumber,
    email: order.email,
    first_name: order.firstName,
    last_name: order.lastName,
    phone: order.phone,
    delivery_address: order.deliveryAddress,
    delivery_city: order.deliveryCity,
    delivery_state: order.deliveryState,
    delivery_postal_code: order.deliveryPostalCode,
    delivery_country: order.deliveryCountry,
    total_amount: decimal(order.totalAmount),
    status: order.status,
    notes: order.notes,
    payment_method: order.paymentMethod,
    items: (order.items ?? []).map((item) => serializeOrderItem(item, req)),
    created_at: datetime(order.createdAt),
    updated_at: datetime(order.updatedAt),
  };
}

export function serializeCartItem(item, req) {
  return {
    id: fromId(item.id),
    product: item.product ? serializeProduct(item.product, req) : null,
    quantity: item.quantity,
    size: item.size,
    created_at: datetime(item.createdAt),
    updated_at: datetime(item.updatedAt),
  };
}

export function serializeAdminUser(admin) {
  return {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    is_active: admin.isActive,
    created_at: datetime(admin.createdAt),
    last_login: datetime(admin.lastLogin),
  };
}
