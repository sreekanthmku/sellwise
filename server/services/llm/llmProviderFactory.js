import { createGeminiProvider } from './providers/gemini.provider.js';
import { createOpenAIProvider } from './providers/openai.provider.js';

/**
 * Factory: pick implementation from config (ENV-driven).
 * @param {import('../../config/index.js').AppConfig} config
 * @returns {{ id: string, modelId: string, analyzeCallAudio: (input: import('./types.js').AnalyzeCallAudioInput) => Promise<import('./types.js').CallAnalysisResult> } | null}
 */
export function createCallAnalysisLlmProvider(config) {
    const id = (config.llmProvider || 'none').toLowerCase();
    if (id === 'none' || id === '' || id === 'off') {
        return null;
    }
    if (id === 'gemini') {
        console.log('[llm] factory: creating Gemini provider', { model: config.geminiModel || 'gemini-2.0-flash' });
        return createGeminiProvider(config);
    }
    if (id === 'openai') {
        return createOpenAIProvider(config);
    }
    throw new Error(`Unknown LLM_PROVIDER "${config.llmProvider}". Use: gemini | openai | none`);
}
