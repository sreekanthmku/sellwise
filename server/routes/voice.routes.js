import { Router } from 'express';
import { voiceAnswer } from '../controllers/voice.controller.js';

/** Vobiz Answer URL (POST to `/`). Mount last so webhooks win. */
export function createVoiceRouter() {
    const router = Router();
    router.post('/', voiceAnswer);
    return router;
}
