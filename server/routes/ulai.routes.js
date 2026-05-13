import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { postUlaiOutboundCall } from '../controllers/ulaiOutbound.controller.js';

export function createUlaiRouter() {
    const router = Router();
    router.post('/ulai/outbound-call', asyncHandler(postUlaiOutboundCall));
    return router;
}
