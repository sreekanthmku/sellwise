import fsp from 'node:fs/promises';
import path from 'node:path';
import { safeFilenamePart } from '../lib/parse.js';

/**
 * Map LLM `call_outcome` or similar to RecentCallCard outcome keys.
 * @param {string} raw
 */
function outcomeFromCallAnalysis(raw) {
    const s = String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');
    if (
        s === 'interested' ||
        s === 'test_drive_requested' ||
        s === 'dealership_visit_planned'
    ) {
        return 'interested';
    }
    if (s === 'not_interested' || s === 'wrong_number' || s === 'busy') {
        return 'notInterested';
    }
    return 'followUp';
}

/**
 * Map Ulai disposition / status string to card outcome.
 * @param {string} raw
 */
function outcomeFromUlaiDisposition(raw) {
    const u = String(raw || '').toUpperCase();
    if (u.includes('FAIL') || u.includes('BUSY') || u.includes('NO_ANSWER') || u.includes('CANCEL')) {
        return 'notInterested';
    }
    if (u.includes('INTEREST')) return 'interested';
    return 'followUp';
}

/**
 * @param {import('../config/index.js').AppConfig} config
 * @param {string} id
 * @returns {Promise<string|null>}
 */
async function tryOutcomeFromDetailsFile(config, id) {
    const filePath = path.resolve(config.callAnalysisDir, `${id}.details.json`);
    const dir = path.resolve(config.callAnalysisDir);
    const prefix = dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`;
    if (filePath === dir || !filePath.startsWith(prefix)) return null;
    try {
        const raw = await fsp.readFile(filePath, 'utf8');
        const data = JSON.parse(raw);
        const co = data?.result?.call_outcome;
        if (typeof co === 'string' && co.trim()) return outcomeFromCallAnalysis(co);
    } catch {
        /* ignore */
    }
    return null;
}

/**
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function listUlaiRecentCalls(config) {
    const root = path.resolve(config.projectRoot);
    let names;
    try {
        names = await fsp.readdir(root);
    } catch {
        return [];
    }

    const prefix = 'recording-callback-';
    const suffix = '.json';
    const callbackFiles = names.filter(
        (n) => n.startsWith(prefix) && n.endsWith(suffix) && n.length > prefix.length + suffix.length,
    );

    /** @type {Array<Record<string, unknown>>} */
    const out = [];

    for (const fileName of callbackFiles) {
        const idPart = fileName.slice(prefix.length, -suffix.length);
        const id = safeFilenamePart(idPart);
        if (!id || id === 'recording') continue;

        const filePath = path.join(root, fileName);
        let doc;
        try {
            const raw = await fsp.readFile(filePath, 'utf8');
            doc = JSON.parse(raw);
        } catch {
            continue;
        }
        if (!doc || typeof doc !== 'object' || doc.source !== 'ulai') continue;

        const call = doc.ulai_call && typeof doc.ulai_call === 'object' ? doc.ulai_call : {};
        const name =
            (typeof call.user_phone_number === 'string' && call.user_phone_number.trim()) ||
            (typeof call.from_number === 'string' && call.from_number.trim()) ||
            'AI call';

        const duration =
            typeof call.duration === 'number' && Number.isFinite(call.duration)
                ? Math.max(0, Math.floor(call.duration))
                : typeof call.duration_ms === 'number' && Number.isFinite(call.duration_ms)
                  ? Math.max(0, Math.floor(call.duration_ms / 1000))
                  : 0;

        let endedAtIso = '';
        if (typeof call.end_time === 'string' && call.end_time.trim()) {
            const d = new Date(call.end_time);
            if (!Number.isNaN(d.getTime())) endedAtIso = d.toISOString();
        }
        if (!endedAtIso && typeof doc.received_at === 'string') {
            const d = new Date(doc.received_at);
            if (!Number.isNaN(d.getTime())) endedAtIso = d.toISOString();
        }
        if (!endedAtIso) endedAtIso = new Date().toISOString();

        let outcome = await tryOutcomeFromDetailsFile(config, id);
        if (!outcome) {
            const disp =
                (typeof call.disposition_status === 'string' && call.disposition_status) ||
                (typeof call.status === 'string' && call.status) ||
                '';
            outcome = outcomeFromUlaiDisposition(disp);
        }

        out.push({
            id: `ulai-${id}`,
            callUuid: id,
            name,
            callType: 'ai',
            outcome,
            durationSeconds: duration,
            endedAtIso,
            leadId: null,
            skipFeedback: true,
        });
    }

    out.sort((a, b) => {
        const da = new Date(String(a.endedAtIso)).getTime();
        const db = new Date(String(b.endedAtIso)).getTime();
        return db - da;
    });

    return out;
}
