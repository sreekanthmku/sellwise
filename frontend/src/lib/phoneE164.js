/** Turn stored display strings (e.g. "+62 821-5567-2233") into E.164 (+digits only). */
export function phoneDisplayToE164(display) {
  const s = String(display ?? "").trim();
  if (!s || s === "—") return "";
  const hasPlus = s.startsWith("+");
  const digits = s.replace(/\D/g, "");
  if (!digits) return "";
  const body = hasPlus ? digits : digits;
  const e164 = `+${body}`;
  if (e164.length < 9 || e164.length > 16) return "";
  return e164;
}
