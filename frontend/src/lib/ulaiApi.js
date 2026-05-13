import { defaultApiBase } from "@/vobiz/constants";

/**
 * @param {string} phone_number E.164
 * @returns {Promise<Record<string, unknown>>}
 */
export async function postUlaiOutboundCall(phone_number) {
  const base = defaultApiBase();
  const res = await fetch(`${base}/api/ulai/outbound-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number }),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    const msg =
      (typeof data.error === "string" && data.error) ||
      (typeof data.detail === "string" && data.detail) ||
      (Array.isArray(data.detail) ? JSON.stringify(data.detail) : "") ||
      res.statusText ||
      "Request failed";
    throw new Error(msg);
  }
  return data;
}
