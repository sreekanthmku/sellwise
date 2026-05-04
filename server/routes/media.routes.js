import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { getSampleAudio } from '../controllers/audio.controller.js';

export function createMediaRouter() {
    const router = Router();
    const serve = asyncHandler(async (req, res) => {
        await getSampleAudio(req.app.locals.config, req, res);
    });
    router.get('/audio', serve);
    router.head('/audio', serve);
    return router;
}
