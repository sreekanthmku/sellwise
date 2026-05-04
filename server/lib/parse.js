import querystring from 'node:querystring';
import path from 'node:path';

/**
 * @param {string} body
 * @param {string} [contentType]
 * @returns {Record<string, string|undefined>}
 */
export function parseMixedBody(body, contentType) {
    if (!body || !String(body).trim()) return {};
    const ct = (contentType || '').toLowerCase();
    if (ct.includes('application/json')) {
        try {
            const parsed = typeof body === 'string' ? JSON.parse(body) : body;
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch {
            return {};
        }
    }
    return querystring.parse(String(body));
}

/**
 * @param {Record<string, unknown>} raw
 */
export function pickRecordingPayload(raw) {
    const get = (k) => {
        if (!raw || typeof raw !== 'object') return undefined;
        if (raw[k] !== undefined && raw[k] !== '') return raw[k];
        const lower = k.toLowerCase();
        for (const key of Object.keys(raw)) {
            if (key.toLowerCase() === lower && raw[key] !== '') return raw[key];
        }
        return undefined;
    };
    const toInt = (v) => {
        if (v === undefined || v === null || v === '') return undefined;
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) ? n : undefined;
    };
    return {
        api_id: get('api_id') || get('ApiId'),
        record_file: get('RecordFile') || get('record_file'),
        record_url: get('record_url') || get('RecordUrl'),
        call_uuid: get('call_uuid') || get('CallUUID'),
        recording_id: get('recording_id') || get('RecordingID'),
        recording_duration: toInt(get('RecordingDuration')) ?? toInt(get('recording_duration')),
        recording_duration_ms: toInt(get('RecordingDurationMs')) ?? toInt(get('recording_duration_ms')),
        recording_start_ms: toInt(get('RecordingStartMs')) ?? toInt(get('recording_start_ms')),
        recording_end_ms: toInt(get('RecordingEndMs')) ?? toInt(get('recording_end_ms')),
    };
}

export function safeFilenamePart(s) {
    return String(s || 'recording').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'recording';
}

/**
 * @param {string} recordUrl
 */
export function extensionFromUrl(recordUrl) {
    try {
        const u = new URL(recordUrl);
        const base = path.basename(u.pathname);
        const dot = base.lastIndexOf('.');
        if (dot > 0 && dot < base.length - 1) {
            const ext = base.slice(dot).toLowerCase();
            if (/^\.[a-z0-9]{1,8}$/.test(ext)) return ext;
        }
    } catch {
        /* ignore */
    }
    return '.audio';
}

function getTranscriptionField(raw, k) {
    if (!raw || typeof raw !== 'object') return undefined;
    if (Object.prototype.hasOwnProperty.call(raw, k)) return raw[k];
    const lower = k.toLowerCase();
    for (const key of Object.keys(raw)) {
        if (key.toLowerCase() === lower) return raw[key];
    }
    return undefined;
}

/**
 * @param {Record<string, unknown>} raw
 */
export function pickTranscriptionPayload(raw) {
    const toNum = (v) => {
        if (v === undefined || v === null || v === '') return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    };
    const toInt = (v) => {
        if (v === undefined || v === null || v === '') return undefined;
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) ? n : undefined;
    };
    const g = (k) => getTranscriptionField(raw, k);
    const str = (v) => (v === undefined || v === null ? undefined : String(v));
    return {
        transcription_charge: toNum(g('transcription_charge')),
        transcription: str(g('transcription')),
        duration: toInt(g('duration')),
        call_uuid: str(g('call_uuid')),
        transcription_rate: toNum(g('transcription_rate')),
        recording_id: str(g('recording_id')),
        error: str(g('error')),
    };
}
