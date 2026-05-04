import fsp from 'node:fs/promises';
import path from 'node:path';
import { pickRecordingPayload, safeFilenamePart, extensionFromUrl } from '../lib/parse.js';
import { downloadToFile } from './httpDownload.js';
import { schedulePostRecordingAnalysis } from './llm/callAnalysis.service.js';

const XML_OK = '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Recording saved</Say></Response>';

/**
 * @param {import('../config/index.js').AppConfig} config
 * @param {Record<string, unknown>} merged
 */
export async function processRecordingCallback(config, merged) {
    const payload = pickRecordingPayload(merged);
    const receivedAt = new Date().toISOString();

    const idPart = payload.call_uuid
    const jsonPath = path.join(config.projectRoot, `recording-callback-${idPart}.json`);

    const out = {
        ...merged,
        ...payload,
        received_at: receivedAt,
        local_recording_path: null,
        download_error: null,
    };

    const downloadUrl = payload.record_file || payload.record_url;
    const extraHeaders = {};
    if (config.recordingXAuthId) extraHeaders['X-Auth-ID'] = config.recordingXAuthId;
    if (config.recordingXAuthToken) extraHeaders['X-Auth-Token'] = config.recordingXAuthToken;

    try {
        await fsp.writeFile(jsonPath, JSON.stringify(out, null, 2), 'utf8');
        console.log('[recording-callback] saved metadata:', jsonPath);
    } catch (e) {
        console.error('[recording-callback] failed to write JSON:', e);
        throw Object.assign(new Error('Failed to save callback data'), { code: 'METADATA_WRITE', status: 500 });
    }

    if (downloadUrl) {
        const needsVobizAuth = /vobiz\.ai/i.test(downloadUrl);
        if (needsVobizAuth && (!config.recordingXAuthId || !config.recordingXAuthToken)) {
            out.download_error =
                'Set RECORDING_X_AUTH_ID and RECORDING_X_AUTH_TOKEN in .env to download Vobiz recordings (RecordFile / media URL).';
            console.error('[recording-callback]', out.download_error);
        } else {
            try {
                await fsp.mkdir(config.recordingsDir, { recursive: true });
                const ext = extensionFromUrl(downloadUrl);
                const localFile = path.join(config.recordingsDir, `recording-${idPart}${ext}`);
                await downloadToFile(downloadUrl, localFile, { extraHeaders });
                out.local_recording_path = localFile;
            } catch (e) {
                out.download_error = e && e.message ? e.message : String(e);
                console.error('[recording-callback] download failed:', out.download_error);
            }
        }
        try {
            await fsp.writeFile(jsonPath, JSON.stringify(out, null, 2), 'utf8');
            console.log('[recording-callback] updated metadata after download:', jsonPath);
            if (out.local_recording_path) {
                console.log(
                    `[recording-callback] scheduling post-download LLM analysis (LLM_PROVIDER=${config.llmProvider}) → ${out.local_recording_path}`
                );
                schedulePostRecordingAnalysis(config, {
                    jsonPath,
                    audioPath: out.local_recording_path,
                    metadata: { ...out },
                });
            }
        } catch (e) {
            console.error('[recording-callback] failed to update JSON after download:', e);
        }
    }

    return XML_OK;
}
