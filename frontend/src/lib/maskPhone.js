/** Groups a run of X masks as triplets separated by spaces (e.g. 8 → "XXX XXX XX"). */
function chunkMaskX(maskLen) {
  if (maskLen <= 0) return "";
  const parts = [];
  let remaining = maskLen;
  while (remaining > 0) {
    const take = Math.min(3, remaining);
    parts.push("X".repeat(take));
    remaining -= take;
  }
  return parts.join(" ");
}

/**
 * Lead detail privacy: last up to 4 digits visible after a hyphen; earlier digits are X,
 * grouped like "XXX XXX-3291". Pass-through for empty or em-dash placeholders.
 */
export function maskPhoneLastFour(phoneDisplay) {
  if (phoneDisplay == null || phoneDisplay === "" || phoneDisplay === "—") {
    return phoneDisplay;
  }
  const digits = String(phoneDisplay).replace(/\D/g, "");
  if (digits.length === 0) {
    return phoneDisplay;
  }
  const showLen = Math.min(4, digits.length);
  const maskLen = digits.length - showLen;
  const tail = digits.slice(-showLen);
  if (maskLen === 0) {
    return tail;
  }
  return `${chunkMaskX(maskLen)}-${tail}`;
}
