import config from '../config.js';

export const PAYMENT_METHOD_LABELS = {
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  cash_on_delivery: 'Cash on Delivery',
};

export const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const money = (value) => Number(value).toFixed(2);
const escape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const header = (subtitle) => `
      <div style="background: linear-gradient(135deg, #2C1810 0%, #8B4513 100%); padding: 30px; text-align: center;">
        <h1 style="color: #D4AF37; margin: 0;">Cropped By Ayerkie</h1>
        <p style="color: white; margin: 10px 0 0;">${escape(subtitle)}</p>
      </div>`;

const footer = `
      <div style="background-color: #2C1810; padding: 20px; text-align: center; color: white; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Cropped By Ayerkie. All rights reserved.</p>
        <p style="margin: 5px 0 0;">UHAS Campus, Ho, Volta Region, Ghana</p>
      </div>`;

/** Sent to the shop owner whenever an order comes in. */
export function newOrderAdminEmail(order) {
  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod;
  const items = order.items ?? [];

  const itemsHtml = items
    .map(
      (item) =>
        `<p style="font-size: 15px; margin: 8px 0; padding-left: 10px; border-left: 3px solid #D4AF37;">&bull; ${escape(
          item.product?.name ?? 'Product',
        )} (Size: ${escape(item.size)}) &times; ${item.quantity} - GH&#8373;${money(Number(item.price) * item.quantity)}</p>`,
    )
    .join('');

  const itemsText = items
    .map(
      (item) =>
        `- ${item.product?.name ?? 'Product'} (Size: ${item.size}) x ${item.quantity} - GH₵${money(
          Number(item.price) * item.quantity,
        )}`,
    )
    .join('\n');

  const notesHtml = order.notes
    ? `<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="color: #2C1810; margin-top: 0;">Customer Notes</h3><p>${escape(
        order.notes,
      )}</p></div>`
    : '';

  return {
    subject: `New Order - ${order.orderNumber}`,
    html: `
    <html>
    <body style="font-family: Arial, sans-serif; color: #2C1810; max-width: 600px; margin: 0 auto;">
      ${header('New Order Received!')}
      <div style="padding: 30px; background-color: #FFF8F0;">
        <h2 style="color: #2C1810;">New Order Alert</h2>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="color: #2C1810; margin-top: 0;">Order Details</h3>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Order Number:</strong> ${escape(order.orderNumber)}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Total Amount:</strong> GH&#8373;${money(order.totalAmount)}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Payment Method:</strong> ${escape(paymentLabel)}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Status:</strong> ${escape(STATUS_LABELS[order.status] ?? order.status)}</p>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2C1810; margin-top: 0;">Customer Information</h3>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Name:</strong> ${escape(order.firstName)} ${escape(order.lastName)}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Email:</strong> ${escape(order.email)}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Phone:</strong> ${escape(order.phone)}</p>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2C1810; margin-top: 0;">Delivery Address</h3>
          <p style="font-size: 15px; line-height: 1.6;">
            ${escape(order.deliveryAddress)}<br>
            ${escape(order.deliveryCity)}, ${escape(order.deliveryState)}<br>
            ${escape(order.deliveryPostalCode)}<br>
            ${escape(order.deliveryCountry)}
          </p>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2C1810; margin-top: 0;">Order Items</h3>
          ${itemsHtml}
        </div>

        <div style="background-color: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #FFE0B2; text-align: center;">
          <p style="margin: 10px 0;">
            <a href="${config.siteUrl}/admin/orders"
               style="display: inline-block; background-color: #D4AF37; color: #2C1810; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View in Admin Dashboard
            </a>
          </p>
        </div>

        ${notesHtml}
      </div>
      ${footer}
    </body>
    </html>`,
    text: `NEW ORDER RECEIVED!

Order Number: ${order.orderNumber}
Total Amount: GH₵${money(order.totalAmount)}
Payment Method: ${paymentLabel}

Customer: ${order.firstName} ${order.lastName}
Email: ${order.email}
Phone: ${order.phone}

Delivery Address:
${order.deliveryAddress}
${order.deliveryCity}, ${order.deliveryState}
${order.deliveryPostalCode}, ${order.deliveryCountry}

Order Items:
${itemsText}

Check the admin dashboard to process this order: ${config.siteUrl}/admin/orders
`,
  };
}

/** Six-digit code for an admin password change. */
export function verificationCodeEmail(admin, code) {
  return {
    subject: 'CroppedByAyerkie Admin - Password Change Verification',
    html: `
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${header('Password Change Request')}
      <div style="padding: 30px; background-color: #FFF8F0;">
        <h2 style="color: #2C1810;">Password Change Verification</h2>
        <p>Hello ${escape(admin.username)},</p>
        <p>You have requested to change your admin password. Please use the verification code below to complete the process:</p>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0 0 10px;">Your Verification Code:</p>
          <h1 style="color: #D4AF37; font-size: 36px; letter-spacing: 5px; margin: 0;">${escape(code)}</h1>
        </div>

        <p style="color: #C84630; font-weight: bold;">This code will expire in 10 minutes.</p>
        <p>If you did not request this password change, please ignore this email and contact support immediately.</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E0E0E0;">
          <p style="font-size: 12px; color: #666;">For security reasons, never share this code with anyone.</p>
        </div>
      </div>
      ${footer}
    </body>
    </html>`,
    text: `CroppedByAyerkie Admin - Password Change Verification

Hello ${admin.username},

You have requested to change your admin password.

Your Verification Code: ${code}

This code will expire in 10 minutes.

If you did not request this password change, please ignore this email.
`,
  };
}

export function passwordChangedEmail(admin) {
  return {
    subject: 'CroppedByAyerkie Admin - Password Changed Successfully',
    html: `
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${header('Password Changed Successfully')}
      <div style="padding: 30px; background-color: #FFF8F0;">
        <h2 style="color: #2C1810;">Password Changed</h2>
        <p>Hello ${escape(admin.username)},</p>
        <p>Your admin password has been changed successfully.</p>
        <p style="color: #C84630; font-weight: bold;">If you did not make this change, please contact support immediately.</p>
      </div>
      ${footer}
    </body>
    </html>`,
    text: `Hello ${admin.username},

Your admin password has been changed successfully.

If you did not make this change, please contact support immediately.
`,
  };
}

export const orderReceivedSms = (order) =>
  `Hi ${order.firstName}! Your Cropped By Ayerkie order #${order.orderNumber} ` +
  `(GH₵${money(order.totalAmount)}) has been received. ` +
  `We'll notify you when it ships. Thank you for shopping with us!`;

export const statusUpdateSms = (order, status) =>
  ({
    processing: `Good news! Your Cropped By Ayerkie order #${order.orderNumber} payment has been confirmed and we're preparing it for delivery.`,
    shipped: `Your Cropped By Ayerkie order #${order.orderNumber} is on its way! You should receive it soon. Track: ${config.siteUrl}/track-order`,
    delivered: `Your Cropped By Ayerkie order #${order.orderNumber} has been delivered! Thank you for shopping with us. We hope you love it!`,
    cancelled: `Your Cropped By Ayerkie order #${order.orderNumber} has been cancelled. If you have questions, please call us at ${config.supportPhone}.`,
  })[status] ?? null;
