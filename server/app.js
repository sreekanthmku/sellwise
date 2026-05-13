import express from 'express';
import { requestLog } from './middleware/requestLog.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { createMediaRouter } from './routes/media.routes.js';
import { createWebhooksRouter } from './routes/webhooks.routes.js';
import { createVoiceRouter } from './routes/voice.routes.js';
import { createCallAnalysisApiRouter } from './routes/callAnalysisApi.routes.js';
import { createUlaiRouter } from './routes/ulai.routes.js';

/**
 * @param {import('./config/index.js').AppConfig} config
 */
export function createApp(config) {
    const app = express();
    app.locals.config = config;
    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    // Allow browser client (e.g. http-server on another port) to call /api/*
    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }
        next();
    });

    app.use(requestLog);
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true, limit: '2mb' }));

    app.get('/health', (req, res) => {
        res.status(200).json({ ok: true });
    });

    app.use('/api', createCallAnalysisApiRouter());
    app.use('/api', createUlaiRouter());
    app.use(createMediaRouter());
    app.use(createWebhooksRouter());
    app.use(createVoiceRouter());

    app.use(errorHandler);
    return app;
}
