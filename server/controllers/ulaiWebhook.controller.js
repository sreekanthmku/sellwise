import { processUlaiCallArtifactsFromWebhook } from '../services/ulaiCallArtifacts.service.js';

/**
 * Ulai webhook: call ended. Logs full request for debugging.
 * Configure in Ulai: POST https://<your-host>/ai-call-ended (no trailing dot)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function ulaiAiCallEnded(req, res) {
    const snapshot = {
        receivedAt: new Date().toISOString(),
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        query: req.query,
        headers: req.headers,
        body: req.body,
    };
    console.log(
        `[Ulai webhook] ${req.method} ${req.originalUrl}`,
        '\n',
        JSON.stringify(snapshot, null, 2),
    );
    if (req.method !== 'POST') {
        res.status(200).json({
            ok: true,
            received: true,
            note: 'Call-ended webhooks should use POST with a JSON body',
        });
        return;
    }

    const config = req.app.locals.config;
    void processUlaiCallArtifactsFromWebhook(config, req.body).catch((err) => {
        console.error('[Ulai artifacts] background error', err);
    });

    res.status(200).json({ ok: true, received: true });
}
