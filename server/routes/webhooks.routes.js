import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { recordingCallback } from '../controllers/recording.controller.js';
import { transcriptionCallback } from '../controllers/transcription.controller.js';

export function createWebhooksRouter() {
    const router = Router();
    router.post(['/recording-callback', '/recording-callback/'], asyncHandler(recordingCallback));
    router.post(['/transcription-callback', '/transcription-callback/'], asyncHandler(transcriptionCallback));
    return router;
}
