import AfricasTalking from 'africastalking';
import config from '../config.js';

let client = null;

function getSms() {
  if (client !== null) return client;

  if (!config.sms.apiKey) {
    console.warn("[sms] AFRICAS_TALKING_API_KEY is not set — SMS will be skipped");
    client = false;
    return client;
  }

  try {
    client = AfricasTalking({ apiKey: config.sms.apiKey, username: config.sms.username }).SMS;
    console.log("[sms] Africa's Talking initialised");
  } catch (error) {
    console.error("[sms] Africa's Talking initialisation error:", error.message);
    client = false;
  }

  return client;
}

/** Send one SMS. Never throws — a failed text must not fail an order. */
export async function sendSms(to, message) {
  const sms = getSms();
  if (!sms || !to) return false;

  try {
    const payload = { to: Array.isArray(to) ? to : [to], message };
    if (config.sms.senderId) payload.from = config.sms.senderId;

    const response = await sms.send(payload);
    console.log(`[sms] sent to ${to}:`, JSON.stringify(response?.SMSMessageData?.Recipients ?? response));
    return true;
  } catch (error) {
    console.error(`[sms] failed to send to ${to}:`, error.message);
    return false;
  }
}
