import { transcribeShortAudio } from '../services/azureSpeech.service.js';

const MIN_BYTES = 100;
const MAX_BYTES = 24 * 1024 * 1024;

/**
 * POST /api/speech/transcribe
 * Body: raw PCM WAV (16 kHz mono), Content-Type: application/octet-stream
 * Query: language (BCP-47), default en-US
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function postSpeechTranscribe(req, res) {
    const config = req.app.locals.config;
    const key = config.azureSpeechKey?.trim();
    const region = config.azureSpeechRegion?.trim();

    if (!key || !region) {
        res.status(503).json({
            ok: false,
            error: 'Speech recognition is not configured (AZURE_SPEECH_KEY / AZURE_SPEECH_REGION).',
        });
        return;
    }

    const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || []);
    if (buf.length < MIN_BYTES) {
        res.status(400).json({ ok: false, error: 'Audio payload is too small.' });
        return;
    }
    if (buf.length > MAX_BYTES) {
        res.status(413).json({ ok: false, error: 'Audio payload is too large.' });
        return;
    }

    const language = typeof req.query.language === 'string' ? req.query.language : 'en-US';

    try {
        const { text, recognitionStatus } = await transcribeShortAudio({
            audioPcmWav: buf,
            language,
            subscriptionKey: key,
            region,
        });
        res.status(200).json({ ok: true, text, recognitionStatus });
    } catch (e) {
        const status = e && typeof e.status === 'number' ? e.status : 502;
        res.status(status >= 400 && status < 600 ? status : 502).json({
            ok: false,
            error: 'Speech-to-text request failed.',
        });
    }
}
