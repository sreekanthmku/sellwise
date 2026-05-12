import fsp from 'node:fs/promises';
import path from 'node:path';
import { createCallAnalysisLlmProvider } from './llmProviderFactory.js';

/**
 * @typedef {'details' | 'feedback' | 'transcript'} AnalysisKind
 */

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
 * @param {import('../../config/index.js').AppConfig} config
 * @param {string} idPart
 * @param {AnalysisKind} kind
 */
function analysisFilePathFor(config, idPart, kind) {
    const suffix = kind === 'feedback' ? 'feedback' : kind === 'transcript' ? 'transcript' : 'details';
    return path.join(config.callAnalysisDir, `${idPart}.${suffix}.json`);
}

/**
 * @param {import('../../config/index.js').AppConfig} config
 * @param {string} idPart
 */
function transcriptFilePathFor(config, idPart) {
    return path.join(config.callTranscriptsDir, `${idPart}.transcript.json`);
}

/**
 * Update only the llm_* status block in the callback JSON.
 * This is intentionally read-modify-write to reduce clobbering when
 * details + feedback analyses run concurrently.
 *
 * @param {string} jsonPath
 * @param {'llm_analysis' | 'llm_feedback' | 'llm_transcript'} llmKey
 * @param {Record<string, unknown>} next
 */
async function persistCallbackLlmState(jsonPath, llmKey, next) {
    let doc;
    try {
        const raw = await fsp.readFile(jsonPath, 'utf8');
        doc = JSON.parse(raw);
    } catch (e) {
        console.error('[llm/call-analysis] could not read callback JSON for state update:', jsonPath, e);
        return;
    }
    if (!doc || typeof doc !== 'object') return;
    doc[llmKey] = next;
    try {
        await fsp.writeFile(jsonPath, JSON.stringify(doc, null, 2), 'utf8');
    } catch (e) {
        console.error('[llm/call-analysis] failed to persist callback JSON state update:', e);
    }
}

/**
 * Run analysis in the background after recording JSON is written.
 * Persists "details" LLM output under `call-analysis/<id>.details.json` and links it from the callback JSON.
 *
 * @param {import('../../config/index.js').AppConfig} config
 * @param {{ jsonPath: string, audioPath: string, metadata: Record<string, unknown> }} ctx
 */
export function schedulePostRecordingAnalysis(config, ctx) {
    void runPostRecordingAnalysis(config, { ...ctx, kind: 'details' }).catch((err) => {
        console.error('[llm/call-analysis] unhandled error:', err);
    });
}

/**
 * @param {import('../../config/index.js').AppConfig} config
 * @param {{ jsonPath: string, audioPath: string, metadata: Record<string, unknown>, kind: AnalysisKind }} ctx
 */
async function runPostRecordingAnalysis(config, ctx) {
    const { jsonPath, audioPath, metadata, kind } = ctx;
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
        `[llm/call-analysis] start kind=${kind} idPart=${idPart} provider=${provider.id} model=${provider.modelId} audio=${audioPath} callbackJson=${jsonPath}`
    );

    let doc;
    try {
        const raw = await fsp.readFile(jsonPath, 'utf8');
        doc = JSON.parse(raw);
    } catch (e) {
        console.error('[llm/call-analysis] could not read callback JSON:', jsonPath, e);
        return;
    }

    const llmKey = kind === 'feedback' ? 'llm_feedback' : kind === 'transcript' ? 'llm_transcript' : 'llm_analysis';
    if (doc[llmKey]?.status === 'completed') {
        console.log(`[llm/call-analysis] already completed (${kind}), skipping:`, jsonPath);
        return;
    }

    const startedAt = new Date().toISOString();
    const runningState = {
        status: 'running',
        provider: provider.id,
        model: provider.modelId,
        started_at: startedAt,
    };
    await persistCallbackLlmState(jsonPath, llmKey, runningState);

    const outputDir = kind === 'transcript' ? config.callTranscriptsDir : config.callAnalysisDir;
    await fsp.mkdir(outputDir, { recursive: true });
    const analysisFilePath = kind === 'transcript' ? transcriptFilePathFor(config, idPart) : analysisFilePathFor(config, idPart, kind);
    const analysisFileRelative = posixRelative(config.projectRoot, analysisFilePath);

    let analysisPayload;
    try {
        const invokeStarted = Date.now();
        const result = await provider.analyzeCallAudio({ audioPath, metadata, analysisKind: kind });
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
        const completedState = {
            status: 'completed',
            provider: provider.id,
            model: provider.modelId,
            started_at: startedAt,
            analyzed_at: analysisPayload.analyzed_at,
            analysis_file: analysisFileRelative,
        };
        await persistCallbackLlmState(jsonPath, llmKey, completedState);
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
        const failedState = {
            status: 'failed',
            provider: provider.id,
            model: provider.modelId,
            started_at: startedAt,
            failed_at: failedAt,
            analysis_file: analysisFileRelative,
            error: msg,
        };
        await persistCallbackLlmState(jsonPath, llmKey, failedState);
    }

    try {
        await fsp.writeFile(analysisFilePath, JSON.stringify(analysisPayload, null, 2), 'utf8');
        console.log('[llm/call-analysis] wrote:', analysisFilePath);
    } catch (e) {
        console.error('[llm/call-analysis] failed to write analysis file:', analysisFilePath, e);
    }

    console.log('[llm/call-analysis] updated callback:', jsonPath, analysisPayload.status);

    if ((kind === 'details' || kind === 'feedback') && analysisPayload.status === 'completed') {
        try {
            await scheduleTranscriptAnalysisByCallUuid(config, idPart);
        } catch (e) {
            console.warn(
                '[llm/call-analysis] could not queue transcript analysis:',
                e && e.message ? e.message : e
            );
        }
    }
}

/**
 * Trigger feedback analysis for an existing call (uses `recording-callback-<id>.json` to locate audio).
 * @param {import('../../config/index.js').AppConfig} config
 * @param {string} callUuid
 */
export async function scheduleFeedbackAnalysisByCallUuid(config, callUuid) {
    const idPart = String(callUuid || '').trim();
    if (!idPart) {
        const err = new Error('callUuid is required');
        // @ts-ignore
        err.status = 400;
        throw err;
    }

    const jsonPath = path.join(config.projectRoot, `recording-callback-${idPart}.json`);
    let doc;
    try {
        const raw = await fsp.readFile(jsonPath, 'utf8');
        doc = JSON.parse(raw);
    } catch (e) {
        const err = new Error('Recording callback JSON not found for callUuid');
        // @ts-ignore
        err.status = 404;
        throw err;
    }

    const audioPath = typeof doc.local_recording_path === 'string' ? doc.local_recording_path : '';
    if (!audioPath) {
        const err = new Error('local_recording_path missing for callUuid; cannot run feedback analysis');
        // @ts-ignore
        err.status = 409;
        throw err;
    }

    // Avoid duplicate work: if feedback file exists, do nothing.
    const feedbackFile = analysisFilePathFor(config, idPart, 'feedback');
    try {
        await fsp.stat(feedbackFile);
        await scheduleTranscriptAnalysisByCallUuid(config, idPart);
        return;
    } catch (e) {
        const se = /** @type {NodeJS.ErrnoException} */ (e);
        if (se.code !== 'ENOENT') throw e;
    }

    void runPostRecordingAnalysis(config, {
        jsonPath,
        audioPath,
        metadata: { ...doc },
        kind: 'feedback',
    }).catch((err) => {
        console.error('[llm/call-analysis] unhandled error (feedback):', err);
    });
}

/**
 * Trigger transcript generation for an existing call (uses `recording-callback-<id>.json` to locate audio).
 * @param {import('../../config/index.js').AppConfig} config
 * @param {string} callUuid
 */
export async function scheduleTranscriptAnalysisByCallUuid(config, callUuid) {
    const idPart = String(callUuid || '').trim();
    if (!idPart) {
        const err = new Error('callUuid is required');
        // @ts-ignore
        err.status = 400;
        throw err;
    }

    const jsonPath = path.join(config.projectRoot, `recording-callback-${idPart}.json`);
    let doc;
    try {
        const raw = await fsp.readFile(jsonPath, 'utf8');
        doc = JSON.parse(raw);
    } catch (e) {
        const err = new Error('Recording callback JSON not found for callUuid');
        // @ts-ignore
        err.status = 404;
        throw err;
    }

    const audioPath = typeof doc.local_recording_path === 'string' ? doc.local_recording_path : '';
    if (!audioPath) {
        const err = new Error('local_recording_path missing for callUuid; cannot run transcript generation');
        // @ts-ignore
        err.status = 409;
        throw err;
    }

    const detailsFile = analysisFilePathFor(config, idPart, 'details');
    const feedbackFile = analysisFilePathFor(config, idPart, 'feedback');
    for (const requiredFile of [detailsFile, feedbackFile]) {
        try {
            await fsp.stat(requiredFile);
        } catch (e) {
            const err = new Error('Call summary and feedback must be generated before transcript generation');
            // @ts-ignore
            err.status = 409;
            throw err;
        }
    }

    const transcriptFile = transcriptFilePathFor(config, idPart);
    try {
        await fsp.stat(transcriptFile);
        return;
    } catch (e) {
        const se = /** @type {NodeJS.ErrnoException} */ (e);
        if (se.code !== 'ENOENT') throw e;
    }

    void runPostRecordingAnalysis(config, {
        jsonPath,
        audioPath,
        metadata: { ...doc },
        kind: 'transcript',
    }).catch((err) => {
        console.error('[llm/call-analysis] unhandled error (transcript):', err);
    });
}
