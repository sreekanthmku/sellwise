import { initiateUlaiOutboundCall } from '../services/ulaiOutbound.service.js';

function normalizeE164(input) {
    const s = String(input || '').trim();
    if (!s) return '';
    if (!s.startsWith('+')) return '';
    const rest = s.slice(1).replace(/\D/g, '');
    if (rest.length < 8 || rest.length > 15) return '';
    return `+${rest}`;
}

/**
 * POST /api/ulai/outbound-call
 * Body: { "phone_number": "+91..." } (or phoneNumber)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function postUlaiOutboundCall(req, res, next) {
    const config = req.app.locals.config;
    const raw =
        req.body?.phone_number ??
        req.body?.phoneNumber ??
        req.body?.mobile ??
        req.body?.mobile_number;
    const phone_number = normalizeE164(raw);

    if (!phone_number) {
        res.status(400).json({
            ok: false,
            error: 'Invalid or missing phone_number (use E.164, e.g. +917012804584)',
        });
        return;
    }

    const missing = [];
    if (!config.ulaiApiKey) missing.push('ULAI_API_KEY');
    if (!config.ulaiWorkspaceId) missing.push('ULAI_WORKSPACE_ID');
    if (!config.ulaiAgentId) missing.push('ULAI_AGENT_ID');
    if (!config.ulaiChannelId) missing.push('ULAI_CHANNEL_ID');
    if (!config.ulaiFromNumber) missing.push('ULAI_FROM_NUMBER');
    if (missing.length) {
        res.status(503).json({
            ok: false,
            error: `Ulai is not configured (set ${missing.join(', ')})`,
        });
        return;
    }

    try {
        const result = await initiateUlaiOutboundCall(config, phone_number);
        res.status(200).json(result);
    } catch (err) {
        if (err.status && err.body !== undefined) {
            res.status(err.status).json(err.body);
            return;
        }
        next(err);
    }
}
