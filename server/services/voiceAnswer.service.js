import { escapeXml } from '../lib/xml.js';

/** @param {Record<string, unknown>} params */
export function mergeVoiceParams(params) {
    return params;
}

/**
 * @param {Record<string, unknown>} params
 */
export function isHangupEvent(params) {
    const event = params.Event || params.event || '';
    return event === 'Hangup';
}

/**
 * @param {Record<string, unknown>} params
 */
export function isSdkOutboundCall(params) {
    const rawFrom = String(params.From || params.from || '');
    const routeType = String(params.RouteType || params.routeType || '').toLowerCase();
    return rawFrom.startsWith('sip:') || routeType === 'sip';
}

/**
 * @param {Record<string, unknown>} params
 */
export function normalizeOutboundDestination(params) {
    let destination = String(params.To || params.to || '');
    if (destination.startsWith('sip:')) {
        const match = destination.match(/^sip:(.*?)@/);
        if (match && match[1]) destination = match[1];
    }
    if (destination && !destination.startsWith('+')) {
        destination = `+${destination}`;
    }
    return destination;
}

/**
 * @param {import('../config/index.js').AppConfig} config
 */
export function recordingCallbackUrl(config) {
    const base = config.publicBaseUrl;
    if (!base) {
        console.warn(
            '[voice] PUBLIC_BASE_URL is not set; using relative /recording-callback/ for Record URLs (set PUBLIC_BASE_URL for production).'
        );
        return '/recording-callback/';
    }
    return `${base}/recording-callback/`;
}

/**
 * @param {import('../config/index.js').AppConfig} config
 * @param {string} destination
 */
export function buildSdkOutboundXml(config, destination) {
    const callerId = escapeXml(config.callerId);
    const dest = escapeXml(destination);
    const cb = escapeXml(recordingCallbackUrl(config));
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Record action="${cb}"
        startOnDialAnswer="true"
        redirect="false"
        maxLength="3600"
        fileFormat="mp3"
        playBeep="false"
        callbackUrl="${cb}"
        callbackMethod="POST"/>
    <Dial callerId="${callerId}">
        <Number>${dest}</Number>
    </Dial>
</Response>`;
}

/**
 * @param {import('../config/index.js').AppConfig} config
 */
export function buildPstnInboundXml(config) {
    const callerId = escapeXml(config.callerId);
    const sip = escapeXml(config.sipEndpoint);
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${callerId}" timeout="30">
        <User>${sip}</User>
    </Dial>
    <Speak>The user is currently on another call. Please try again later. Goodbye.</Speak>
    <Hangup/>
</Response>`;
}

export const hangupXml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

/**
 * @param {Record<string, unknown>} params
 * @param {import('../config/index.js').AppConfig} config
 * @returns {{ type: 'hangup' } | { type: 'sdk', destination: string } | { type: 'pstn' } | { type: 'error', status: number, message: string }}
 */
export function resolveVoiceAnswer(params, config) {
    if (isHangupEvent(params)) {
        return { type: 'hangup' };
    }
    if (!config.callerId) {
        return {
            type: 'error',
            status: 500,
            message: 'Server misconfigured: CALLER_ID environment variable is not set.',
        };
    }
    if (isSdkOutboundCall(params)) {
        const destination = normalizeOutboundDestination(params);
        console.log(`-> SDK outbound call, bridging to: ${destination}`);
        return { type: 'sdk', destination };
    }
    if (!config.sipEndpoint) {
        return {
            type: 'error',
            status: 500,
            message: 'Server misconfigured: SIP_ENDPOINT environment variable is not set.',
        };
    }
    const rawFrom = String(params.From || params.from || '');
    const from =
        rawFrom && !rawFrom.startsWith('+') && !rawFrom.startsWith('sip:')
            ? `+${rawFrom}`
            : rawFrom || 'Unknown';
    console.log(`-> PSTN inbound from ${from}, ringing endpoint: ${config.sipEndpoint}`);
    return { type: 'pstn' };
}
