import fsp from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { safeFilenamePart } from '../lib/parse.js';
import {
    scheduleFeedbackAnalysisByCallUuid,
    scheduleTranscriptAnalysisByCallUuid,
} from '../services/llm/callAnalysis.service.js';

const POLL_MS = 1000;
const DEFAULT_MAX_ATTEMPTS = 100;
const ABSOLUTE_MAX_ATTEMPTS = 200;

const AUDIO_MIME_BY_EXT = {
    '.mp3': 'audio/mpeg',
    '.mpeg': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.mp4': 'audio/mp4',
    '.aac': 'audio/aac',
    '.webm': 'audio/webm',
    '.audio': 'audio/mpeg',
};

/**
 * Resolve analysis JSON path under `call-analysis/` (no path traversal).
 * @param {import('../config/index.js').AppConfig} config
 * @param {string} callUuid
 * @param {'details' | 'feedback'} kind
 */
function resolveAnalysisFilePath(config, callUuid, kind) {
    const raw = String(callUuid || '').trim();
    if (!raw) {
        const err = new Error('callUuid is required');
        err.status = 400;
        throw err;
    }
    const id = safeFilenamePart(raw);
    if (!id || id === 'recording') {
        const err = new Error('Invalid callUuid');
        err.status = 400;
        throw err;
    }
    const dir = path.resolve(config.callAnalysisDir);
    const fileName =
        kind === 'feedback' ? `${id}.feedback.json` : kind === 'details' ? `${id}.details.json` : `${id}.json`;
    const filePath = path.resolve(dir, fileName);
    const prefix = dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`;
    if (filePath !== dir && !filePath.startsWith(prefix)) {
        const err = new Error('Invalid path');
        err.status = 400;
        throw err;
    }
    return { filePath, id };
}

/**
 * @param {import('../config/index.js').AppConfig} config
 * @param {string} callUuid
 */
async function findRecordingFile(config, callUuid) {
    const id = safeFilenamePart(String(callUuid || '').trim());
    if (!id || id === 'recording') {
        const err = new Error('Invalid callUuid');
        err.status = 400;
        throw err;
    }

    const dir = path.resolve(config.recordingsDir);
    const prefix = `recording-${id}`;
    let names;
    try {
        names = await fsp.readdir(dir);
    } catch (e) {
        const err = /** @type {NodeJS.ErrnoException} */ (e);
        if (err.code === 'ENOENT') {
            const notFound = new Error('Recording not found');
            notFound.status = 404;
            throw notFound;
        }
        throw err;
    }

    const fileName = names.find((name) => name === prefix || name.startsWith(`${prefix}.`));
    if (!fileName) {
        const err = new Error('Recording not found');
        err.status = 404;
        throw err;
    }

    const filePath = path.resolve(dir, fileName);
    const dirPrefix = dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`;
    if (filePath !== dir && !filePath.startsWith(dirPrefix)) {
        const err = new Error('Invalid recording path');
        err.status = 400;
        throw err;
    }

    return { filePath, fileName, id };
}

/**
 * GET /api/call-analysis/:callUuid
 * Polls every 1s until `call-analysis/<id>.details.json` exists (fallback: legacy `call-analysis/<id>.json`).
 *
 * Query: maxAttempts (default 100, max 200) — total tries before 504.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getCallAnalysisByUuid(req, res) {
    const config = req.app.locals.config;
    const { filePath, id } = resolveAnalysisFilePath(config, req.params.callUuid, 'details');
    const legacyPath = path.resolve(path.dirname(filePath), `${id}.json`);

    let maxAttempts = parseInt(String(req.query.maxAttempts || ''), 10);
    if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
        maxAttempts = DEFAULT_MAX_ATTEMPTS;
    }
    maxAttempts = Math.min(ABSOLUTE_MAX_ATTEMPTS, maxAttempts);

    let lastError = /** @type {NodeJS.ErrnoException | null} */ (null);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            let raw;
            try {
                raw = await fsp.readFile(filePath, 'utf8');
            } catch (e) {
                const err = /** @type {NodeJS.ErrnoException} */ (e);
                if (err.code === 'ENOENT') {
                    raw = await fsp.readFile(legacyPath, 'utf8');
                } else {
                    throw err;
                }
            }
            const data = JSON.parse(raw);
            res.status(200).json({
                ok: true,
                id,
                attempts: attempt,
                poll_interval_ms: POLL_MS,
                analysis: data,
            });
            return;
        } catch (e) {
            const err = /** @type {NodeJS.ErrnoException} */ (e);
            lastError = err;
            if (err.code !== 'ENOENT') {
                const wrap = new Error(err.message || 'Failed to read analysis file');
                wrap.status = 500;
                throw wrap;
            }
        }
        if (attempt < maxAttempts) {
            await delay(POLL_MS);
        }
    }

    res.status(504).json({
        ok: false,
        id,
        error: 'Analysis file not found within wait window',
        attempts: maxAttempts,
        poll_interval_ms: POLL_MS,
        waited_ms: (maxAttempts - 1) * POLL_MS,
        hint: 'Ensure LLM analysis ran and id matches recording_id or call_uuid used in recording-callback-*.json',
        last_errno: lastError?.code,
    });
}

/**
 * POST /api/call-analysis/:callUuid/feedback
 * Triggers feedback analysis generation (non-blocking).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function triggerCallFeedbackByUuid(req, res) {
    const config = req.app.locals.config;
    const { id } = resolveAnalysisFilePath(config, req.params.callUuid, 'feedback');
    await scheduleFeedbackAnalysisByCallUuid(config, id);
    res.status(202).json({ ok: true, id, status: 'queued' });
}

/**
 * GET /api/call-analysis/:callUuid/feedback
 * Polls every 1s until `call-analysis/<id>.feedback.json` exists (fallback: legacy `call-analysis/<id>.json`).
 *
 * Query: maxAttempts (default 100, max 200) — total tries before 504.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getCallFeedbackByUuid(req, res) {
    const config = req.app.locals.config;
    const { filePath, id } = resolveAnalysisFilePath(config, req.params.callUuid, 'feedback');
    const legacyPath = path.resolve(path.dirname(filePath), `${id}.json`);

    let maxAttempts = parseInt(String(req.query.maxAttempts || ''), 10);
    if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
        maxAttempts = DEFAULT_MAX_ATTEMPTS;
    }
    maxAttempts = Math.min(ABSOLUTE_MAX_ATTEMPTS, maxAttempts);

    let lastError = /** @type {NodeJS.ErrnoException | null} */ (null);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            let raw;
            try {
                raw = await fsp.readFile(filePath, 'utf8');
            } catch (e) {
                const err = /** @type {NodeJS.ErrnoException} */ (e);
                if (err.code === 'ENOENT') {
                    raw = await fsp.readFile(legacyPath, 'utf8');
                } else {
                    throw err;
                }
            }
            const data = JSON.parse(raw);
            res.status(200).json({
                ok: true,
                id,
                attempts: attempt,
                poll_interval_ms: POLL_MS,
                analysis: data,
            });
            return;
        } catch (e) {
            const err = /** @type {NodeJS.ErrnoException} */ (e);
            lastError = err;
            if (err.code !== 'ENOENT') {
                const wrap = new Error(err.message || 'Failed to read analysis file');
                wrap.status = 500;
                throw wrap;
            }
        }
        if (attempt < maxAttempts) {
            await delay(POLL_MS);
        }
    }

    res.status(504).json({
        ok: false,
        id,
        error: 'Analysis file not found within wait window',
        attempts: maxAttempts,
        poll_interval_ms: POLL_MS,
        waited_ms: (maxAttempts - 1) * POLL_MS,
        hint: 'Ensure LLM analysis ran and id matches recording_id or call_uuid used in recording-callback-*.json',
        last_errno: lastError?.code,
    });
}

/**
 * GET /api/call-analysis/:callUuid/recording
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getCallRecordingByUuid(req, res) {
    const config = req.app.locals.config;
    const { filePath, fileName } = await findRecordingFile(config, req.params.callUuid);
    const ext = path.extname(fileName).toLowerCase();
    res.setHeader('Content-Type', AUDIO_MIME_BY_EXT[ext] || 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.sendFile(filePath);
}

/**
 * GET /api/call-analysis/:callUuid/transcript
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getCallTranscriptByUuid(req, res) {
    const config = req.app.locals.config;
    const id = safeFilenamePart(String(req.params.callUuid || '').trim());
    if (!id || id === 'recording') {
        res.status(400).json({ ok: false, error: 'Invalid callUuid' });
        return;
    }

    const generatedTranscriptPath = path.resolve(config.callTranscriptsDir, `${id}.transcript.json`);
    const transcriptsDir = path.resolve(config.callTranscriptsDir);
    const transcriptsPrefix = transcriptsDir.endsWith(path.sep) ? transcriptsDir : `${transcriptsDir}${path.sep}`;
    if (generatedTranscriptPath === transcriptsDir || !generatedTranscriptPath.startsWith(transcriptsPrefix)) {
        res.status(400).json({ ok: false, error: 'Invalid transcript path' });
        return;
    }

    try {
        const raw = await fsp.readFile(generatedTranscriptPath, 'utf8');
        const parsed = JSON.parse(raw);
        const result = parsed && typeof parsed === 'object' ? parsed.result : null;
        res.status(200).json({
            ok: true,
            id,
            source: 'gemini',
            status: parsed.status || 'completed',
            transcript: typeof result?.transcript === 'string' ? result.transcript : '',
            segments: Array.isArray(result?.segments) ? result.segments : [],
            entry: parsed,
        });
        return;
    } catch (e) {
        const err = /** @type {NodeJS.ErrnoException} */ (e);
        if (err.code !== 'ENOENT') throw err;
    }

    try {
        await scheduleTranscriptAnalysisByCallUuid(config, id);
    } catch (e) {
        const err = /** @type {Error & { status?: number }} */ (e);
        if (err.status && err.status !== 409 && err.status !== 404) throw err;
    }

    let entries = [];
    try {
        const raw = await fsp.readFile(config.transcriptsFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) entries = parsed;
    } catch (e) {
        const err = /** @type {NodeJS.ErrnoException} */ (e);
        if (err.code !== 'ENOENT') throw err;
    }

    const match = [...entries]
        .reverse()
        .find((entry) => {
            const callUuid = entry && typeof entry.call_uuid === 'string' ? safeFilenamePart(entry.call_uuid) : '';
            const recordingId =
                entry && typeof entry.recording_id === 'string' ? safeFilenamePart(entry.recording_id) : '';
            return callUuid === id || recordingId === id;
        });

    res.status(200).json({
        ok: true,
        id,
        source: match ? 'transcription_callback' : 'gemini_pending',
        status: match ? 'completed' : 'pending',
        transcript: typeof match?.transcription === 'string' ? match.transcription : '',
        segments: [],
        entry: match || null,
    });
}
