import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { getCallAnalysisByUuid } from '../controllers/callAnalysisPublic.controller.js';

/** GET /api/call-analysis/:callUuid */
export function createCallAnalysisApiRouter() {
    const router = Router();
    router.get('/call-analysis/:callUuid', asyncHandler(getCallAnalysisByUuid));
    return router;
}
