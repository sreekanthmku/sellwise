import fsp from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';
import { buildCallAnalysisPrompt } from '../prompts/callAnalysisPrompt.js';
import { extractJsonObject, validateCallAnalysisResult } from '../parseAnalysisJson.js';

/**
 * OpenAI Chat Completions `input_audio.format` (file extension hint).
 * @param {string} audioPath
 */
function openAiInputAudioFormat(audioPath) {
    const ext = path.extname(audioPath).toLowerCase();
    if (ext === '.wav') return 'wav';
    if (ext === '.mp3') return 'mp3';
    if (ext === '.m4a') return 'm4a';
    if (ext === '.ogg') return 'ogg';
    if (ext === '.webm') return 'webm';
    return 'mp3';
}

/**
 * @param {import('../../../config/index.js').AppConfig} config
 */
export function createOpenAIProvider(config) {
    const apiKey = config.openaiApiKey;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
    }
    const modelName = config.openaiModel || 'gpt-4o';
    const client = new OpenAI({ apiKey });

    return {
        id: /** @type {const} */ ('openai'),
        modelId: modelName,

        /**
         * @param {import('../types.js').AnalyzeCallAudioInput} input
         * @returns {Promise<import('../types.js').CallAnalysisResult>}
         */
        async analyzeCallAudio(input) {
            const { audioPath, metadata } = input;
            const buf = await fsp.readFile(audioPath);
            const base64 = buf.toString('base64');
            const format = openAiInputAudioFormat(audioPath);
            const prompt = buildCallAnalysisPrompt(metadata || {});

            console.log(
                `[openai] analyzeCallAudio start model=${modelName} audio=${audioPath} format=${format} audioBytes=${buf.length} base64Len=${base64.length} promptChars=${prompt.length}`
            );

            const t0 = Date.now();
            let completion;
            try {
                completion = await client.chat.completions.create({
                    model: modelName,
                    response_format: { type: 'json_object' },
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: prompt },
                                {
                                    type: 'input_audio',
                                    input_audio: { data: base64, format },
                                },
                            ],
                        },
                    ],
                });
            } catch (err) {
                const elapsed = Date.now() - t0;
                console.error(
                    `[openai] chat.completions.create failed after ${elapsed}ms model=${modelName} audio=${audioPath}`,
                    err && err.message ? err.message : err
                );
                if (err && err.stack) {
                    console.error('[openai] stack:', err.stack);
                }
                throw err;
            }

            const elapsedMs = Date.now() - t0;
            const usage = completion.usage;
            if (usage) {
                console.log(
                    `[openai] chat.completions ok in ${elapsedMs}ms promptTokens=${usage.prompt_tokens} completionTokens=${usage.completion_tokens} totalTokens=${usage.total_tokens}`
                );
            } else {
                console.log(`[openai] chat.completions ok in ${elapsedMs}ms (no usage on response)`);
            }

            const choice = completion.choices[0];
            const finish = choice?.finish_reason;
            if (finish && finish !== 'stop') {
                console.warn(`[openai] finish_reason=${finish}`);
            }

            const text = choice?.message?.content;
            if (!text || !String(text).trim()) {
                console.error('[openai] empty message content; choice:', JSON.stringify(choice).slice(0, 1500));
                throw new Error('OpenAI returned empty text content');
            }

            const textLen = text.length;
            console.log(`[openai] response text length=${textLen}`);

            let parsed;
            try {
                parsed = extractJsonObject(text);
            } catch (err) {
                console.error('[openai] JSON parse failed; response head:', String(text).slice(0, 500));
                throw err;
            }

            let out;
            try {
                out = validateCallAnalysisResult(parsed);
            } catch (err) {
                console.error('[openai] analysis shape validation failed:', err && err.message ? err.message : err);
                console.error('[openai] raw LLM text (truncated):', String(text).slice(0, 4000));
                console.error('[openai] parsed JSON (truncated):', JSON.stringify(parsed).slice(0, 4000));
                throw err;
            }
            console.log('[openai] validated call analysis JSON shape OK');
            return out;
        },
    };
}
