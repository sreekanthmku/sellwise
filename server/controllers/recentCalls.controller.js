import { listUlaiRecentCalls } from '../services/recentCalls.service.js';

/**
 * GET /api/recent-calls
 * Ulai AI calls derived from `recording-callback-<call_id>.json` (source: ulai).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getRecentCalls(req, res) {
    const config = req.app.locals.config;
    const calls = await listUlaiRecentCalls(config);
    res.status(200).json({ ok: true, calls });
}
