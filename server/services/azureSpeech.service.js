/**
 * Azure Speech-to-text (short audio) via REST.
 * @see https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text
 */

/**
 * @param {object} opts
 * @param {Buffer} opts.audioPcmWav
 * @param {string} opts.language BCP-47 locale, e.g. en-US
 * @param {string} opts.subscriptionKey
 * @param {string} opts.region e.g. eastus
 * @returns {Promise<{ text: string, recognitionStatus: string }>}
 */
export async function transcribeShortAudio({ audioPcmWav, language, subscriptionKey, region }) {
    const regionClean = String(region || '')
        .trim()
        .replace(/^https?:\/\//i, '')
        .split('.')[0];
    if (!regionClean) {
        throw new Error('AZURE_SPEECH_REGION is required');
    }

    const lang = String(language || 'en-US').trim() || 'en-US';
    const url = new URL(
        `https://${regionClean}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
    );
    url.searchParams.set('language', lang);
    url.searchParams.set('format', 'simple');

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
            Accept: 'application/json',
        },
        body: audioPcmWav,
    });

    const text = await res.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = null;
    }

    if (!res.ok) {
        const err = new Error(`Azure STT HTTP ${res.status}`);
        err.status = res.status;
        err.azureBody = text;
        throw err;
    }

    if (!json || typeof json !== 'object') {
        const err = new Error('Azure STT: invalid JSON response');
        err.azureBody = text;
        throw err;
    }

    const status = typeof json.RecognitionStatus === 'string' ? json.RecognitionStatus : 'Unknown';
    const display =
        typeof json.DisplayText === 'string'
            ? json.DisplayText
            : typeof json.Text === 'string'
              ? json.Text
              : '';

    return { text: display.trim(), recognitionStatus: status };
}
