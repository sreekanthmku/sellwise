import { processRecordingCallback } from '../services/recording.service.js';

/** @param {Record<string, unknown>} query @param {unknown} body */
function mergeParams(query, body) {
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    return { ...query, ...b };
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function recordingCallback(req, res, next) {
    const config = req.app.locals.config;
    try {
        const merged = mergeParams(req.query, req.body);
        const xml = await processRecordingCallback(config, merged);
        res.type('text/xml').send(xml);
    } catch (e) {
        next(e);
    }
}
