import { logUlaiHttpResponse } from '../lib/logUlaiHttp.js';

/**
 * @param {import('../config/index.js').AppConfig} config
 * @param {string} phoneNumber E.164 destination
 * @returns {Promise<Record<string, unknown>>}
 */
export async function initiateUlaiOutboundCall(config, phoneNumber) {
    const base = String(config.ulaiBaseUrl || '')
        .trim()
        .replace(/\/+$/, '');
    const url = `${base}/api/v1/voice/outbound-call`;

    const body = {
        agent_id: config.ulaiAgentId,
        channel_id: config.ulaiChannelId,
        channel: config.ulaiChannel,
        phone_number: phoneNumber,
        from_number: config.ulaiFromNumber,
        metadata: {},
    };

    const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': config.ulaiApiKey,
        'X-Workspace-ID': config.ulaiWorkspaceId,
    };

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { raw: text };
    }

    logUlaiHttpResponse('voice/outbound-call', 'POST', url, res.status, data);

    if (!res.ok) {
        let msg = `Ulai outbound call failed (${res.status})`;
        if (typeof data?.detail === 'string') msg = data.detail;
        else if (Array.isArray(data?.detail)) msg = JSON.stringify(data.detail);
        const err = new Error(msg);
        err.status = res.status;
        err.body = data;
        throw err;
    }

    return data;
}
