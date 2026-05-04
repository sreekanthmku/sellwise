import {
    resolveVoiceAnswer,
    buildSdkOutboundXml,
    buildPstnInboundXml,
    hangupXml,
} from '../services/voiceAnswer.service.js';

function mergeParams(query, body) {
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    return { ...query, ...b };
}

/**
 * Vobiz dynamic Answer URL (POST to app root or dedicated path).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function voiceAnswer(req, res) {
    const config = req.app.locals.config;
    const params = mergeParams(req.query, req.body);
    console.log(`[params] ${JSON.stringify(params)}`);

    const decision = resolveVoiceAnswer(params, config);

    if (decision.type === 'hangup') {
        res.type('text/xml').send(hangupXml);
        return;
    }
    if (decision.type === 'error') {
        res.status(decision.status).type('text/plain').send(decision.message);
        return;
    }
    if (decision.type === 'sdk') {
        res.type('text/xml').send(buildSdkOutboundXml(config, decision.destination));
        return;
    }
    res.type('text/xml').send(buildPstnInboundXml(config));
}
