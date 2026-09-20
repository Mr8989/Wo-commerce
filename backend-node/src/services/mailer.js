import nodemailer from 'nodemailer';
import config from '../config.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!config.email.host || !config.email.user) {
    console.warn('[mail] EMAIL_HOST_USER is not set — emails will be logged instead of sent');
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    // Port 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: config.email.port === 465,
    requireTLS: config.email.useTls && config.email.port !== 465,
    auth: { user: config.email.user, pass: config.email.password },
  });

  return transporter;
}

/**
 * Send one message. Set `failSilently` for mail that shouldn't fail the
 * request it was triggered by (Django's `fail_silently=True`).
 */
export async function sendMail({ to, subject, text, html, failSilently = false }) {
  if (!to) {
    if (failSilently) return false;
    throw new Error('No recipient address for outgoing mail');
  }

  try {
    await getTransporter().sendMail({
      from: config.email.from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
    });
    console.log(`[mail] sent "${subject}" to ${to}`);
    return true;
  } catch (error) {
    console.error(`[mail] failed to send "${subject}" to ${to}:`, error.message);
    if (!failSilently) throw error;
    return false;
  }
}
