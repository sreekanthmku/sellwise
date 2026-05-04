import fsp from 'node:fs/promises';
import path from 'node:path';
import { createCallAnalysisLlmProvider } from './llmProviderFactory.js';

/**
 * @param {string} jsonPath
 */
function idPartFromRecordingCallbackPath(jsonPath) {
    const base = path.basename(jsonPath);
    const m = /^recording-callback-(.+)\.json$/i.exec(base);
    return m ? m[1] : path.basename(base, '.json');
}

/**
 * @param {string} projectRoot
 * @param {string} absolutePath
 */
function posixRelative(projectRoot, absolutePath) {
    return path.relative(projectRoot, absolutePath).split(path.sep).join('/');
}

/**
 * Run analysis in the background after recording JSON is written.
 * Persists full LLM output under `call-analysis/<id>.json` and links it from the callback JSON.
 *
 * @param {import('../../config/index.js').AppConfig} config
 * @param {{ jsonPath: string, audioPath: string, metadata: Record<string, unknown> }} ctx
 */
export function schedulePostRecordingAnalysis(config, ctx) {
    void runPostRecordingAnalysis(config, ctx).catch((err) => {
        console.error('[llm/call-analysis] unhandled error:', err);
    });
}

/**
 * @param {import('../../config/index.js').AppConfig} config
 * @param {{ jsonPath: string, audioPath: string, metadata: Record<string, unknown> }} ctx
 */
async function runPostRecordingAnalysis(config, ctx) {
    const { jsonPath, audioPath, metadata } = ctx;
    const idPart = idPartFromRecordingCallbackPath(jsonPath);

    let provider;
    try {
        provider = createCallAnalysisLlmProvider(config);
    } catch (e) {
        console.warn('[llm/call-analysis] skipped (config):', e.message);
        return;
    }
    if (!provider) {
        console.log('[llm/call-analysis] LLM_PROVIDER is none/off — not calling Gemini/OpenAI.');
        return;
    }

    console.log(
        `[llm/call-analysis] start idPart=${idPart} provider=${provider.id} model=${provider.modelId} audio=${audioPath} callbackJson=${jsonPath}`
    );

    let doc;
    try {
        const raw = await fsp.readFile(jsonPath, 'utf8');
        doc = JSON.parse(raw);
    } catch (e) {
        console.error('[llm/call-analysis] could not read callback JSON:', jsonPath, e);
        return;
    }

    if (doc.llm_analysis?.status === 'completed') {
        console.log('[llm/call-analysis] already completed, skipping:', jsonPath);
        return;
    }

    const startedAt = new Date().toISOString();
    doc.llm_analysis = {
        status: 'running',
        provider: provider.id,
        model: provider.modelId,
        started_at: startedAt,
    };
    try {
        await fsp.writeFile(jsonPath, JSON.stringify(doc, null, 2), 'utf8');
    } catch (e) {
        console.error('[llm/call-analysis] failed to write running state:', e);
    }

    await fsp.mkdir(config.callAnalysisDir, { recursive: true });
    const analysisFilePath = path.join(config.callAnalysisDir, `${idPart}.json`);
    const analysisFileRelative = posixRelative(config.projectRoot, analysisFilePath);

    let analysisPayload;
    try {
        const invokeStarted = Date.now();
        const result = await provider.analyzeCallAudio({ audioPath, metadata });
        console.log(
            `[llm/call-analysis] provider returned OK idPart=${idPart} in ${Date.now() - invokeStarted}ms → writing ${analysisFilePath}`
        );
        analysisPayload = {
            id: idPart,
            status: 'completed',
            source_callback_json: posixRelative(config.projectRoot, jsonPath),
            audio_file: posixRelative(config.projectRoot, audioPath),
            provider: provider.id,
            model: provider.modelId,
            started_at: startedAt,
            analyzed_at: new Date().toISOString(),
            result,
        };
        doc.llm_analysis = {
            status: 'completed',
            provider: provider.id,
            model: provider.modelId,
            started_at: startedAt,
            analyzed_at: analysisPayload.analyzed_at,
            analysis_file: analysisFileRelative,
        };
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        console.error(`[llm/call-analysis] provider failed idPart=${idPart}:`, msg);
        if (e && e.stack) {
            console.error('[llm/call-analysis] stack:', e.stack);
        }
        const failedAt = new Date().toISOString();
        analysisPayload = {
            id: idPart,
            status: 'failed',
            source_callback_json: posixRelative(config.projectRoot, jsonPath),
            audio_file: posixRelative(config.projectRoot, audioPath),
            provider: provider.id,
            model: provider.modelId,
            started_at: startedAt,
            failed_at: failedAt,
            error: msg,
        };
        doc.llm_analysis = {
            status: 'failed',
            provider: provider.id,
            model: provider.modelId,
            started_at: startedAt,
            failed_at: failedAt,
            analysis_file: analysisFileRelative,
            error: msg,
        };
    }

    try {
        await fsp.writeFile(analysisFilePath, JSON.stringify(analysisPayload, null, 2), 'utf8');
        console.log('[llm/call-analysis] wrote:', analysisFilePath);
    } catch (e) {
        console.error('[llm/call-analysis] failed to write analysis file:', analysisFilePath, e);
    }

    try {
        await fsp.writeFile(jsonPath, JSON.stringify(doc, null, 2), 'utf8');
        console.log('[llm/call-analysis] updated callback:', jsonPath, doc.llm_analysis.status);
    } catch (e) {
        console.error('[llm/call-analysis] failed to persist callback JSON:', e);
    }
}
