import config from '../config.js';
import { sendMail } from './mailer.js';
import { sendSms } from './sms.js';
import { newOrderAdminEmail, orderReceivedSms, statusUpdateSms } from './templates.js';

/**
 * On a new order: text the customer (paid, ~GH₵0.05) and email the shop
 * owner (free). Neither failure should surface to the customer, so both are
 * swallowed and logged.
 */
export async function sendOrderNotifications(order) {
  const results = await Promise.allSettled([
    sendSms(order.phone, orderReceivedSms(order)),
    sendAdminOrderEmail(order),
  ]);

  for (const result of results) {
    if (result.status === 'rejected') console.error('[notify] order notification failed:', result.reason);
  }
}

async function sendAdminOrderEmail(order) {
  const { subject, text, html } = newOrderAdminEmail(order);
  return sendMail({ to: config.email.adminEmail, subject, text, html, failSilently: true });
}

/** Text the customer when their order moves to a new status. */
export async function sendStatusUpdateSms(order, newStatus) {
  const message = statusUpdateSms(order, newStatus);
  if (!message) return false;
  return sendSms(order.phone, message);
}
