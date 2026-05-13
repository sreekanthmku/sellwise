import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { recordingCallback } from '../controllers/recording.controller.js';
import { transcriptionCallback } from '../controllers/transcription.controller.js';
import { ulaiAiCallEnded } from '../controllers/ulaiWebhook.controller.js';

const ULAI_CALL_ENDED_PATHS = ['/ai-call-ended', '/ai-call-ended/', '/ai-call-ended.'];

export function createWebhooksRouter() {
    const router = Router();
    router.post(['/recording-callback', '/recording-callback/'], asyncHandler(recordingCallback));
    router.post(['/transcription-callback', '/transcription-callback/'], asyncHandler(transcriptionCallback));
    // Include `/ai-call-ended.` — Ulai / dashboards sometimes store a trailing dot on the URL
    router.all(ULAI_CALL_ENDED_PATHS, ulaiAiCallEnded);
    return router;
}
