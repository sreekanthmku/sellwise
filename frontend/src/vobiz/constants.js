export function defaultApiBase() {
  const fromEnv = process.env.REACT_APP_API_BASE_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim().replace(/\/+$/, "");
  return "http://127.0.0.1:3001";
}
