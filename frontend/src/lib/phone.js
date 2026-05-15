import { mergeLeadDetail } from "@/data/leadDetails";

function digitsCore(s) {
  return String(s || "").replace(/\D/g, "");
}

/**
 * Find a human list lead whose stored phone matches a keypad-sanitized destination
 * (E.164 or national digits, compared by full digit string and last 9–10 digits).
 */
export function findHumanLeadBySanitizedDestination(humanLeads, sanitizedDest) {
  if (!sanitizedDest || !Array.isArray(humanLeads)) return null;
  const target = digitsCore(sanitizedDest);
  if (!target) return null;
  for (const lead of humanLeads) {
    const raw = mergeLeadDetail(lead).phoneDisplay;
    if (!raw || raw === "—") continue;
    const d = digitsCore(raw);
    if (!d) continue;
    if (d === target) return lead;
    if (d.length >= 7 && target.length >= 7) {
      if (d.slice(-10) === target.slice(-10) || d.slice(-9) === target.slice(-9)) return lead;
    }
  }
  return null;
}

/**
 * Find a lead whose stored phone matches a display phone or dialed destination.
 * Accepts any lead list, so it can resolve both human and AI mock leads.
 */
export function findLeadByPhoneDisplay(leads, phoneDisplay) {
  if (!phoneDisplay || !Array.isArray(leads)) return null;
  const target = digitsCore(phoneDisplay);
  if (!target) return null;
  for (const lead of leads) {
    const raw = mergeLeadDetail(lead).phoneDisplay;
    if (!raw || raw === "—") continue;
    const d = digitsCore(raw);
    if (!d) continue;
    if (d === target) return lead;
    if (d.length >= 7 && target.length >= 7) {
      if (d.slice(-10) === target.slice(-10) || d.slice(-9) === target.slice(-9)) return lead;
    }
  }
  return null;
}

/** Groups digits for display; preserves leading + and trailing * / # */
export function formatDialDisplay(raw) {
  if (!raw) return "";
  const extras = raw.replace(/[\d+\s]/g, "");
  const leadPlus = raw.startsWith("+");
  const digitStr = (leadPlus ? raw.slice(1) : raw).replace(/\D/g, "");
  const grouped = digitStr.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const prefix = leadPlus ? "+" : "";
  const tail = extras ? ` ${extras}` : "";
  return `${prefix}${grouped}${tail}`.trim();
}
