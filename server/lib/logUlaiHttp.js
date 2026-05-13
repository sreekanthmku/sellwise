/**
 * Log Ulai API response (status + parsed body) for every request.
 * @param {string} context Short label e.g. "outbound-call" | "calls/details"
 * @param {string} method
 * @param {string} url
 * @param {number} status HTTP status
 * @param {unknown} body Parsed body (object or fallback)
 */
export function logUlaiHttpResponse(context, method, url, status, body) {
    let serialized;
    try {
        serialized =
            typeof body === 'object' && body !== null
                ? JSON.stringify(body, null, 2)
                : String(body);
    } catch {
        serialized = '[unserializable body]';
    }
    console.log(`[Ulai] ${context} ${method} ${url} → ${status}\n${serialized}`);
}
