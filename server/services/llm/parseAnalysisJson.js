/**
 * Strip optional ```json ... ``` wrapper and parse.
 * @param {string} text
 */
export function extractJsonObject(text) {
    const trimmed = String(text).trim();
    const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(trimmed);
    const candidate = fence ? fence[1].trim() : trimmed;
    return JSON.parse(candidate);
}

/**
 * @param {unknown} obj
 * @returns {import('./types.js').CallAnalysisResult}
 */
export function validateCallAnalysisResult(obj) {
    if (!obj || typeof obj !== 'object') {
        throw new Error('Analysis result is not an object');
    }
    const o = /** @type {Record<string, unknown>} */ (obj);
    if (!o.customer_sentiment || typeof o.customer_sentiment !== 'object') {
        throw new Error('Missing customer_sentiment');
    }
    if (!o.sales_person_feedback || typeof o.sales_person_feedback !== 'object') {
        throw new Error('Missing sales_person_feedback');
    }
    if (!Array.isArray(o.next_action_items)) {
        throw new Error('Missing or invalid next_action_items array');
    }
    return /** @type {import('./types.js').CallAnalysisResult} */ (o);
}
