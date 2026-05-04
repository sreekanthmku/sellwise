import fsp from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { safeFilenamePart } from '../lib/parse.js';

const POLL_MS = 3000;
const DEFAULT_MAX_ATTEMPTS = 100;
const ABSOLUTE_MAX_ATTEMPTS = 200;

/**
 * Resolve analysis JSON path under `call-analysis/` (no path traversal).
 * @param {import('../config/index.js').AppConfig} config
 * @param {string} callUuid
 */
function resolveAnalysisFilePath(config, callUuid) {
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
    const filePath = path.resolve(dir, `${id}.json`);
    const prefix = dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`;
    if (filePath !== dir && !filePath.startsWith(prefix)) {
        const err = new Error('Invalid path');
        err.status = 400;
        throw err;
    }
    return { filePath, id };
}

/**
 * GET /api/call-analysis/:callUuid
 * Polls every 3s until `call-analysis/<id>.json` exists (same id rules as recording callback filenames).
 *
 * Query: maxAttempts (default 100, max 200) — total tries before 504.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getCallAnalysisByUuid(req, res) {
    const config = req.app.locals.config;
    const { filePath, id } = resolveAnalysisFilePath(config, req.params.callUuid);

    let maxAttempts = parseInt(String(req.query.maxAttempts || ''), 10);
    if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
        maxAttempts = DEFAULT_MAX_ATTEMPTS;
    }
    maxAttempts = Math.min(ABSOLUTE_MAX_ATTEMPTS, maxAttempts);

    let lastError = /** @type {NodeJS.ErrnoException | null} */ (null);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const raw = await fsp.readFile(filePath, 'utf8');
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
