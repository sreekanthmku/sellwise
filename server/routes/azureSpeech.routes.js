import express from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { postSpeechTranscribe } from '../controllers/azureSpeech.controller.js';

export function createAzureSpeechRouter() {
    const router = express.Router();
    router.post(
        '/transcribe',
        express.raw({ type: 'application/octet-stream', limit: '25mb' }),
        asyncHandler(postSpeechTranscribe),
    );
    return router;
}
