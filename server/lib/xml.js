/**
 * Escape text for safe inclusion in XML attribute values and text nodes.
 * @param {unknown} unsafe
 * @returns {string}
 */
export function escapeXml(unsafe) {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
