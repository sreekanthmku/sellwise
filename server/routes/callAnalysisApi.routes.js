import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import {
    getCallAnalysisByUuid,
    getCallFeedbackByUuid,
    getCallRecordingByUuid,
    getCallTranscriptByUuid,
    triggerCallFeedbackByUuid,
} from '../controllers/callAnalysisPublic.controller.js';
import { getRecentCalls } from '../controllers/recentCalls.controller.js';

/** GET /api/call-analysis/:callUuid */
export function createCallAnalysisApiRouter() {
    const router = Router();
    router.get('/recent-calls', asyncHandler(getRecentCalls));
    router.get('/call-analysis/:callUuid', asyncHandler(getCallAnalysisByUuid));
    router.post('/call-analysis/:callUuid/feedback', asyncHandler(triggerCallFeedbackByUuid));
    router.get('/call-analysis/:callUuid/feedback', asyncHandler(getCallFeedbackByUuid));
    router.get('/call-analysis/:callUuid/recording', asyncHandler(getCallRecordingByUuid));
    router.get('/call-analysis/:callUuid/transcript', asyncHandler(getCallTranscriptByUuid));
    return router;
}
