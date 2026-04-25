// ============================================================
// WhatsApp helpers.
// Builds wa.me links — no API, no cost, opens the merchant's WhatsApp
// with a pre-filled message they can review and edit before sending.
//
// Messages come in EN and SI. Template includes order confirmation content,
// and conditionally adds courier/tracking block when a waybill is set.
// ============================================================

import type { Lang } from "./i18n";
import { formatLKR } from "./i18n";

export interface WhatsAppOrder {
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  customer_city: string | null;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number | string;
  shipping_fee: number | string;
  total: number | string;
  courier: string | null;
  waybill_number: string | null;
}

export interface WhatsAppBusiness {
  business_name: string;
  phone: string | null;
}

export interface WhatsAppItem {
  product_name: string;
  quantity: number;
  unit_price: number | string;
}

// Normalize a SL phone to international format for wa.me.
// wa.me requires digits only, with country code, no +.
// Accepts: '0771234567', '+94771234567', '94 77 123 4567', '077-123-4567', '771234567'
// Returns: '94771234567' (always 11 digits for SL) or null if unrecognizable.
export function normalizePhoneForWhatsApp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Already has country code 94 prefix
  if (digits.startsWith("94") && digits.length === 11) return digits;

  // Starts with leading 0 — strip and prefix 94
  if (digits.startsWith("0") && digits.length === 10) return "94" + digits.slice(1);

  // Just the 9-digit mobile number (e.g., 771234567)
  if (digits.length === 9) return "94" + digits;

  // Fallback — if it already starts with 94 but unusual length, trust it
  if (digits.startsWith("94")) return digits;

  // Anything else — return as-is so wa.me can try, user can edit
  return digits;
}

// Build the full WhatsApp URL with pre-filled message.
export function buildWhatsAppLink(
  phone: string | null | undefined,
  message: string,
): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  // encodeURIComponent handles Sinhala characters + line breaks correctly
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

// Generate the order confirmation / tracking update message.
// If the order has a waybill_number, it becomes a tracking update.
// Otherwise, it's an order confirmation.
export function buildOrderMessage({
  order,
  business,
  items,
  lang,
}: {
  order: WhatsAppOrder;
  business: WhatsAppBusiness;
  items: WhatsAppItem[];
  lang: Lang;
}): string {
  const hasTracking = !!order.waybill_number;
  return lang === "si" ? buildMessageSI(order, business, items, hasTracking) : buildMessageEN(order, business, items, hasTracking);
}

// ----- English template -----
function buildMessageEN(
  order: WhatsAppOrder,
  business: WhatsAppBusiness,
  items: WhatsAppItem[],
  hasTracking: boolean,
): string {
  const greeting = `Hi ${order.customer_name}, `;
  const opener = hasTracking
    ? `your order *${order.order_number}* from *${business.business_name}* has been dispatched! 📦`
    : `thank you for your order from *${business.business_name}*! 🙏`;

  const itemsList = items
    .map((it) => `• ${it.product_name} × ${it.quantity} — ${formatLKR(Number(it.unit_price) * it.quantity)}`)
    .join("\n");

  const paymentMethodLabel =
    order.payment_method === "cod"
      ? "Cash on Delivery"
      : order.payment_method === "bank_transfer"
        ? "Bank transfer"
        : "Cash";

  const shippingLine =
    Number(order.shipping_fee) > 0 ? `Shipping: ${formatLKR(order.shipping_fee)}\n` : "";

  const addressBlock =
    order.customer_address || order.customer_city
      ? `\n*Delivery address*\n${[order.customer_address, order.customer_city].filter(Boolean).join(", ")}\n`
      : "";

  const trackingBlock = hasTracking
    ? `\n*Tracking*\nCourier: ${order.courier ?? "-"}\nWaybill: ${order.waybill_number}\nExpected delivery: 1-3 business days\n`
    : "";

  const paymentBlock =
    order.payment_method === "cod" && order.payment_status !== "paid"
      ? `\nPlease have *${formatLKR(order.total)}* ready for the courier on delivery.\n`
      : order.payment_method === "bank_transfer" && order.payment_status !== "paid"
        ? `\nPlease complete the bank transfer of *${formatLKR(order.total)}* to confirm this order.\n`
        : "";

  const closer = hasTracking
    ? `Any questions, feel free to reply here. Thank you! 🙏`
    : `We'll send you tracking details as soon as the order is dispatched. Thank you! 🙏`;

  const contactLine = business.phone ? `\n—\n${business.business_name}\n${business.phone}` : `\n—\n${business.business_name}`;

  return `${greeting}${opener}

*Order #${order.order_number}*
${itemsList}

Subtotal: ${formatLKR(order.subtotal)}
${shippingLine}*Total: ${formatLKR(order.total)}*
Payment: ${paymentMethodLabel}${addressBlock}${trackingBlock}${paymentBlock}
${closer}${contactLine}`;
}

// ----- Sinhala template -----
function buildMessageSI(
  order: WhatsAppOrder,
  business: WhatsAppBusiness,
  items: WhatsAppItem[],
  hasTracking: boolean,
): string {
  const greeting = `ආයුබෝවන් ${order.customer_name}, `;
  const opener = hasTracking
    ? `ඔබේ *${order.order_number}* ඇණවුම *${business.business_name}* වෙතින් යවා ඇත! 📦`
    : `*${business.business_name}* වෙතින් ඇණවුම් කිරීමට ස්තූතියි! 🙏`;

  const itemsList = items
    .map((it) => `• ${it.product_name} × ${it.quantity} — ${formatLKR(Number(it.unit_price) * it.quantity)}`)
    .join("\n");

  const paymentMethodLabel =
    order.payment_method === "cod"
      ? "භාරදීමේදී මුදල් (COD)"
      : order.payment_method === "bank_transfer"
        ? "බැංකු මාරුව"
        : "මුදල්";

  const shippingLine =
    Number(order.shipping_fee) > 0 ? `ප්‍රවාහන ගාස්තුව: ${formatLKR(order.shipping_fee)}\n` : "";

  const addressBlock =
    order.customer_address || order.customer_city
      ? `\n*භාරදෙන ලිපිනය*\n${[order.customer_address, order.customer_city].filter(Boolean).join(", ")}\n`
      : "";

  const trackingBlock = hasTracking
    ? `\n*Tracking විස්තර*\nකුරියර්: ${order.courier ?? "-"}\nWaybill: ${order.waybill_number}\nබලාපොරොත්තු වන භාරදීම: දින 1-3\n`
    : "";

  const paymentBlock =
    order.payment_method === "cod" && order.payment_status !== "paid"
      ? `\nකරුණාකර භාරදෙන අවස්ථාවේදී කුරියර් වෙත *${formatLKR(order.total)}* සූදානම්ව තබාගන්න.\n`
      : order.payment_method === "bank_transfer" && order.payment_status !== "paid"
        ? `\nමෙම ඇණවුම තහවුරු කිරීමට *${formatLKR(order.total)}* බැංකු මාරුව සම්පූර්ණ කරන්න.\n`
        : "";

  const closer = hasTracking
    ? `කිසියම් ප්‍රශ්නයක් තිබේ නම්, මෙතනින්ම reply කරන්න. ස්තූතියි! 🙏`
    : `ඇණවුම යවන අවස්ථාවේදී tracking විස්තර එවන්නෙමු. ස්තූතියි! 🙏`;

  const contactLine = business.phone ? `\n—\n${business.business_name}\n${business.phone}` : `\n—\n${business.business_name}`;

  return `${greeting}${opener}

*ඇණවුම #${order.order_number}*
${itemsList}

උප එකතුව: ${formatLKR(order.subtotal)}
${shippingLine}*මුළු එකතුව: ${formatLKR(order.total)}*
ගෙවීම: ${paymentMethodLabel}${addressBlock}${trackingBlock}${paymentBlock}
${closer}${contactLine}`;
}

// Label to show on the button — depends on whether the order has a waybill yet
export function whatsappButtonLabel(order: WhatsAppOrder, lang: Lang): string {
  const hasTracking = !!order.waybill_number;
  if (lang === "si") {
    return hasTracking ? "Tracking යවන්න" : "ඇණවුම යවන්න";
  }
  return hasTracking ? "Send tracking" : "Send confirmation";
}