import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Repository root (parent of `server/`). */
export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * @typedef {object} AppConfig
 * @property {string} projectRoot
 * @property {number} port
 * @property {string} recordingsDir
 * @property {string} callTranscriptsDir
 * @property {string} transcriptsFile
 * @property {string} callAnalysisDir
 * @property {string} sampleMp3
 * @property {string} publicBaseUrl
 * @property {string} [callerId]
 * @property {string} [sipEndpoint]
 * @property {string} [recordingXAuthId]
 * @property {string} [recordingXAuthToken]
 * @property {string} llmProvider
 * @property {string} [geminiApiKey]
 * @property {string} [geminiModel]
 * @property {string} [openaiApiKey]
 * @property {string} [openaiModel]
 */

/** @returns {AppConfig} */
export function loadConfig() {
    const portRaw = process.env.PORT;
    const port = portRaw ? parseInt(portRaw, 10) : 3001;
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid PORT: ${portRaw}`);
    }

    const publicBaseUrl = String(process.env.PUBLIC_BASE_URL || '')
        .trim()
        .replace(/\/+$/, '');

    const llmProvider = String(process.env.LLM_PROVIDER || 'none')
        .trim()
        .toLowerCase();

    return {
        projectRoot: PROJECT_ROOT,
        port,
        recordingsDir: path.join(PROJECT_ROOT, 'recordings'),
        callTranscriptsDir: path.join(PROJECT_ROOT, 'call-transcripts'),
        transcriptsFile: path.join(PROJECT_ROOT, 'transcripts.json'),
        callAnalysisDir: path.join(PROJECT_ROOT, 'call-analysis'),
        sampleMp3: path.join(PROJECT_ROOT, 'sample.mp3'),
        publicBaseUrl,
        callerId: process.env.CALLER_ID,
        sipEndpoint: process.env.SIP_ENDPOINT,
        recordingXAuthId: process.env.RECORDING_X_AUTH_ID,
        recordingXAuthToken: process.env.RECORDING_X_AUTH_TOKEN,
        llmProvider,
        geminiApiKey: process.env.GEMINI_API_KEY,
        geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        openaiApiKey: process.env.OPENAI_API_KEY,
        openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
    };
}
