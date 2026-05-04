import fsp from 'node:fs/promises';
import { pickTranscriptionPayload } from '../lib/parse.js';

/**
 * @param {string} transcriptsFile
 * @param {Record<string, unknown>} entry
 * @returns {Promise<number>} new total count
 */
export async function appendTranscriptsJson(transcriptsFile, entry) {
    let list = [];
    try {
        const text = await fsp.readFile(transcriptsFile, 'utf8');
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) list = parsed;
    } catch (e) {
        if (e.code !== 'ENOENT') {
            console.warn('[transcription-callback] could not read transcripts.json, starting fresh:', e.message);
        }
    }
    list.push(entry);
    await fsp.writeFile(transcriptsFile, JSON.stringify(list, null, 2), 'utf8');
    return list.length;
}

/**
 * @param {import('../config/index.js').AppConfig} config
 * @param {Record<string, unknown>} merged
 */
export async function processTranscriptionCallback(config, merged) {
    const payload = pickTranscriptionPayload(merged);
    const receivedAt = new Date().toISOString();

    const entry = {
        ...merged,
        ...payload,
        received_at: receivedAt,
    };

    const total = await appendTranscriptsJson(config.transcriptsFile, entry);
    console.log('[transcription-callback] appended to', config.transcriptsFile, `(entries: ${total})`);
    return { total, file: config.transcriptsFile };
}
