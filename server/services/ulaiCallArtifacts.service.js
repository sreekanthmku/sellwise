import fs from 'node:fs/promises';
import path from 'node:path';
import { downloadToFile } from './httpDownload.js';
import { logUlaiHttpResponse } from '../lib/logUlaiHttp.js';
import { schedulePostRecordingAnalysis } from './llm/callAnalysis.service.js';

const RETRY_MS = 5000;
/** Poll GET /calls/details until recording + transcript exist (5s between tries). */
const MAX_FETCH_ATTEMPTS = 24;

function ulaiBase(config) {
    return String(config.ulaiBaseUrl || '')
        .trim()
        .replace(/\/+$/, '');
}

function ulaiHeaders(config) {
    return {
        'X-API-Key': config.ulaiApiKey,
        'X-Workspace-ID': config.ulaiWorkspaceId,
    };
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {import('../config/index.js').AppConfig} config
 * @param {string} callId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function fetchUlaiCallDetails(config, callId) {
    const base = ulaiBase(config);
    const url = new URL(`${base}/api/v1/calls/details`);
    url.searchParams.set('call_id', callId);

    const res = await fetch(url.href, {
        method: 'GET',
        headers: ulaiHeaders(config),
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { raw: text };
    }

    logUlaiHttpResponse('calls/details', 'GET', url.href, res.status, data);

    if (!res.ok) {
        const msg =
            typeof data?.detail === 'string'
                ? data.detail
                : `Ulai call details failed (${res.status})`;
        const err = new Error(msg);
        err.status = res.status;
        err.body = data;
        throw err;
    }

    return data;
}

function artifactDirs(config) {
    const root = path.join(config.projectRoot, 'ai-call');
    return {
        transcriptsDir: path.join(root, 'transcripts'),
        recordingsDir: path.join(root, 'recordings'),
    };
}

/**
 * Save Ulai transcript JSON next to other AI call artifacts.
 * @returns {Promise<boolean>} true if a file was written
 */
async function saveUlaiTranscriptToDisk(callId, transcript, config) {
    if (transcript == null || typeof transcript !== 'object') return false;
    const { transcriptsDir } = artifactDirs(config);
    await fs.mkdir(transcriptsDir, { recursive: true });
    const tPath = path.join(transcriptsDir, `${callId}.json`);
    await fs.writeFile(tPath, `${JSON.stringify(transcript, null, 2)}\n`, 'utf8');
    console.log(`[Ulai artifacts] wrote transcript ${tPath}`);
    return true;
}

/**
 * Download recording once; reuse existing non-empty file.
 * @returns {Promise<string|null>} absolute path to recording
 */
async function ensureUlaiRecordingOnDisk(callId, recording, config) {
    if (recording == null || typeof recording !== 'object') return null;
    const signedUrl = recording.signed_url;
    if (typeof signedUrl !== 'string' || !signedUrl.startsWith('http')) {
        return null;
    }
    const fmt = typeof recording.format === 'string' ? recording.format : 'mp4';
    const safeExt = fmt.replace(/[^a-z0-9]/gi, '') || 'mp4';
    const { recordingsDir } = artifactDirs(config);
    await fs.mkdir(recordingsDir, { recursive: true });
    const rPath = path.join(recordingsDir, `${callId}.${safeExt}`);
    try {
        const st = await fs.stat(rPath);
        if (st.size > 0) {
            return rPath;
        }
    } catch {
        /* download */
    }
    await downloadToFile(signedUrl, rPath);
    console.log(`[Ulai artifacts] wrote recording ${rPath}`);
    return rPath;
}

/**
 * Same shape as Vobiz flow: `recording-callback-<call_id>.json` + `local_recording_path` for LLM details.
 * @returns {Promise<{ jsonPath: string, doc: Record<string, unknown> }>}
 */
async function mergeWriteUlaiRecordingCallback(config, callId, audioPath, detailsResponse) {
    const jsonPath = path.join(config.projectRoot, `recording-callback-${callId}.json`);
    let doc = {};
    try {
        doc = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    } catch {
        /* new file */
    }
    const now = new Date().toISOString();
    Object.assign(doc, {
        source: 'ulai',
        call_uuid: callId,
        received_at: typeof doc.received_at === 'string' ? doc.received_at : now,
        local_recording_path: audioPath,
        ulai_call: detailsResponse?.call ?? null,
        ulai_details_fetched_at: now,
    });
    await fs.writeFile(jsonPath, JSON.stringify(doc, null, 2), 'utf8');
    console.log(`[Ulai artifacts] wrote recording callback stub ${jsonPath}`);
    return { jsonPath, doc };
}

function scheduleUlaiCallDetailsAnalysis(config, callId, audioPath, metadataDoc) {
    const jsonPath = path.join(config.projectRoot, `recording-callback-${callId}.json`);
    schedulePostRecordingAnalysis(config, {
        jsonPath,
        audioPath,
        metadata: { ...metadataDoc },
        skipFollowUpTranscript: true,
    });
    console.log(
        `[Ulai artifacts] scheduled call details LLM analysis (no feedback/transcript chain) for ${callId}`,
    );
}

function extractCallId(body) {
    if (!body || typeof body !== 'object') return null;
    const id = body.call_id ?? body.data?.call_id;
    return typeof id === 'string' && id.trim() ? id.trim() : null;
}

function isCallEndedEvent(body) {
    if (!body || typeof body !== 'object') return false;
    const t = body.event_type ?? body.data?.event_type;
    return t === 'call.ended';
}

/**
 * After webhook `call.ended`: poll call details; save recording/transcript; run details-only LLM when audio is ready.
 * @param {import('../config/index.js').AppConfig} config
 * @param {Record<string, unknown>} webhookBody
 */
export async function processUlaiCallArtifactsFromWebhook(config, webhookBody) {
    if (!config.ulaiApiKey || !config.ulaiWorkspaceId) {
        console.warn('[Ulai artifacts] skip: ULAI_API_KEY or ULAI_WORKSPACE_ID not set');
        return;
    }

    if (!isCallEndedEvent(webhookBody)) {
        return;
    }

    const callId = extractCallId(webhookBody);
    if (!callId) {
        console.warn('[Ulai artifacts] skip: no call_id on webhook body');
        return;
    }

    console.log(
        `[Ulai artifacts] start call_id=${callId} (max ${MAX_FETCH_ATTEMPTS} attempts, ${RETRY_MS}ms gap)`,
    );

    let lastDetails = null;
    let recordingPath = null;
    let detailsAnalysisScheduled = false;
    let transcriptSaved = false;

    for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt++) {
        try {
            lastDetails = await fetchUlaiCallDetails(config, callId);
        } catch (e) {
            console.error(`[Ulai artifacts] fetch attempt ${attempt} failed`, e.message || e);
            if (attempt < MAX_FETCH_ATTEMPTS) {
                await sleep(RETRY_MS);
            }
            continue;
        }

        const recording = lastDetails?.recording ?? null;
        const transcript = lastDetails?.transcript ?? null;

        if (recording != null) {
            const p = await ensureUlaiRecordingOnDisk(callId, recording, config);
            if (p) {
                recordingPath = p;
                if (!detailsAnalysisScheduled) {
                    const { doc } = await mergeWriteUlaiRecordingCallback(
                        config,
                        callId,
                        p,
                        lastDetails,
                    );
                    scheduleUlaiCallDetailsAnalysis(config, callId, p, doc);
                    detailsAnalysisScheduled = true;
                }
            }
        }

        if (transcript != null) {
            const wrote = await saveUlaiTranscriptToDisk(callId, transcript, config);
            if (wrote) transcriptSaved = true;
        }

        if (recordingPath && transcriptSaved) {
            console.log(`[Ulai artifacts] done call_id=${callId} (attempt ${attempt})`);
            return;
        }

        console.log(
            `[Ulai artifacts] call_id=${callId} attempt ${attempt}/${MAX_FETCH_ATTEMPTS}: recording=${recordingPath ? 'on_disk' : 'pending'} transcript=${transcriptSaved ? 'saved' : 'pending'}`,
        );

        if (attempt < MAX_FETCH_ATTEMPTS) {
            await sleep(RETRY_MS);
        }
    }

    const recording = lastDetails?.recording ?? null;
    const transcript = lastDetails?.transcript ?? null;
    if (recording == null && transcript == null) {
        console.warn(`[Ulai artifacts] no data to save call_id=${callId}`);
        return;
    }
    console.warn(`[Ulai artifacts] max attempts reached call_id=${callId}; saving partial if any`);

    if (recording != null) {
        const p = await ensureUlaiRecordingOnDisk(callId, recording, config);
        if (p) {
            recordingPath = p;
            if (!detailsAnalysisScheduled) {
                const { doc } = await mergeWriteUlaiRecordingCallback(config, callId, p, lastDetails);
                scheduleUlaiCallDetailsAnalysis(config, callId, p, doc);
            }
        }
    }
    if (transcript != null && !transcriptSaved) {
        await saveUlaiTranscriptToDisk(callId, transcript, config);
    }
}
