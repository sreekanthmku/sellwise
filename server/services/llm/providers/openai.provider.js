/**
 * Placeholder for OpenAI (or compatible) multimodal audio analysis.
 * Implement `analyzeCallAudio` when you add OPENAI_API_KEY + audio support.
 *
 * @param {import('../../../config/index.js').AppConfig} config
 */
export function createOpenAIProvider(config) {
    return {
        id: /** @type {const} */ ('openai'),
        modelId: config.openaiModel || 'gpt-4o',

        /**
         * @param {import('../types.js').AnalyzeCallAudioInput} input
         */
        async analyzeCallAudio(input) {
            void config;
            void input;
            throw new Error(
                'OpenAI provider is not implemented yet. Use LLM_PROVIDER=gemini or add audio analysis in server/services/llm/providers/openai.provider.js'
            );
        },
    };
}
