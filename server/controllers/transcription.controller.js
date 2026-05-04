import { processTranscriptionCallback } from '../services/transcription.service.js';

function mergeParams(query, body) {
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    return { ...query, ...b };
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function transcriptionCallback(req, res, next) {
    const config = req.app.locals.config;
    try {
        const merged = mergeParams(req.query, req.body);
        const { total, file } = await processTranscriptionCallback(config, merged);
        res.status(200).json({ ok: true, file, total });
    } catch (e) {
        next(e);
    }
}
