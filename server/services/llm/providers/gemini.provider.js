import fsp from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildCallAnalysisPrompt } from '../prompts/callAnalysisPrompt.js';
import { extractJsonObject, validateCallAnalysisResult } from '../parseAnalysisJson.js';

/**
 * @param {string} audioPath
 */
function mimeForAudioPath(audioPath) {
    const ext = path.extname(audioPath).toLowerCase();
    if (ext === '.mp3') return 'audio/mpeg';
    if (ext === '.wav') return 'audio/wav';
    if (ext === '.ogg') return 'audio/ogg';
    if (ext === '.webm') return 'audio/webm';
    if (ext === '.m4a') return 'audio/mp4';
    return 'audio/mpeg';
}

/**
 * @param {import('../../../config/index.js').AppConfig} config
 */
export function createGeminiProvider(config) {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
    }
    const modelName = config.geminiModel || 'gemini-2.0-flash';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 0.25,
            responseMimeType: 'application/json',
            // Omit maxOutputTokens so the model uses its default maximum output length.
        },
    });

    return {
        id: /** @type {const} */ ('gemini'),
        modelId: modelName,

        /**
         * @param {import('../types.js').AnalyzeCallAudioInput} input
         * @returns {Promise<import('../types.js').CallAnalysisResult>}
         */
        async analyzeCallAudio(input) {
            const { audioPath, metadata } = input;
            const buf = await fsp.readFile(audioPath);
            const base64 = buf.toString('base64');
            const mimeType = mimeForAudioPath(audioPath);
            const prompt = buildCallAnalysisPrompt(metadata || {});
            const audioBytes = buf.length;
            const promptChars = prompt.length;

            console.log(
                `[gemini] analyzeCallAudio start model=${modelName} audio=${audioPath} mime=${mimeType} audioBytes=${audioBytes} base64Len=${base64.length} promptChars=${promptChars}`
            );

            const t0 = Date.now();
            let result;
            try {
                result = await model.generateContent([
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType,
                            data: base64,
                        },
                    },
                ]);
            } catch (err) {
                const elapsed = Date.now() - t0;
                console.error(
                    `[gemini] generateContent failed after ${elapsed}ms model=${modelName} audio=${audioPath}`,
                    err && err.message ? err.message : err
                );
                if (err && err.stack) {
                    console.error('[gemini] stack:', err.stack);
                }
                throw err;
            }

            const elapsedMs = Date.now() - t0;
            const usage = result.response.usageMetadata;
            if (usage) {
                console.log(
                    `[gemini] generateContent ok in ${elapsedMs}ms promptTokens=${usage.promptTokenCount} candidatesTokens=${usage.candidatesTokenCount} totalTokens=${usage.totalTokenCount}${usage.cachedContentTokenCount != null ? ` cached=${usage.cachedContentTokenCount}` : ''}`
                );
            } else {
                console.log(`[gemini] generateContent ok in ${elapsedMs}ms (no usageMetadata on response)`);
            }

            const pf = result.response.promptFeedback;
            if (pf && (pf.blockReason || pf.safetyRatings?.length)) {
                console.warn('[gemini] promptFeedback:', JSON.stringify(pf));
            }

            let text;
            try {
                text = result.response.text();
            } catch (err) {
                console.error('[gemini] response.text() failed:', err && err.message ? err.message : err);
                const cand = result.response.candidates;
                if (cand) {
                    console.error('[gemini] candidates (truncated):', JSON.stringify(cand).slice(0, 2000));
                }
                throw err;
            }

            const textLen = text ? text.length : 0;
            console.log(`[gemini] response text length=${textLen}`);

            let parsed;
            try {
                parsed = extractJsonObject(text);
            } catch (err) {
                console.error('[gemini] JSON parse failed; response head:', String(text).slice(0, 500));
                throw err;
            }

            const out = validateCallAnalysisResult(parsed);
            console.log('[gemini] validated call analysis JSON shape OK');
            return out;
        },
    };
}
