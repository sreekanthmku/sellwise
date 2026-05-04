/**
 * Opens WhatsApp (web or app via wa.me) for a display-formatted phone string.
 * Returns false if the string has no usable digits.
 */
export function openWhatsAppChat(phoneDisplay) {
  if (!phoneDisplay || typeof phoneDisplay !== "string") return false;
  const digits = phoneDisplay.replace(/\D/g, "");
  if (digits.length < 8) return false;
  const url = `https://wa.me/${digits}`;
  // Same-window navigation avoids blank PWA webview when returning from WhatsApp (standalone / iOS).
  window.location.assign(url);
  return true;
}
