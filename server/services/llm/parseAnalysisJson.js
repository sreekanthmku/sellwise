/**
 * Strip optional ```json ... ``` wrapper and parse.
 * @param {string} text
 */
export function extractJsonObject(text) {
    const trimmed = String(text).trim();
    const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(trimmed);
    const candidate = fence ? fence[1].trim() : trimmed;
    return JSON.parse(candidate);
}

/** @type {import('./types.js').SuzukiGuidelineStatus[]} */
const GUIDELINE_STATUSES = ['met', 'partially_met', 'not_met', 'not_observed'];

/** @type {string[]} */
const GUIDELINE_KEYS = [
    'opening_protocol',
    'tone_and_pace',
    'two_way_communication',
    'needs_discovery',
    'fab_explanation',
    'objection_offer_handling',
    'professionalism_focus',
    'closing_protocol',
];

/** @type {import('./types.js').NextActionType[]} */
const NEXT_ACTION_TYPES = [
    'dealership_visit',
    'test_drive',
    'callback',
    'info_request',
    'none',
];

/**
 * @param {string} t
 * @returns {t is import('./types.js').NextActionType}
 */
function isNextActionType(t) {
    return NEXT_ACTION_TYPES.includes(/** @type {import('./types.js').NextActionType} */ (t));
}

/**
 * @param {unknown} raw
 * @param {string} legacyNextAction
 * @returns {{ next_actions: import('./types.js').NextActionItem[], next_action: string }}
 */
function normalizeNextActions(raw, legacyNextAction) {
    /** @type {import('./types.js').NextActionItem[]} */
    let items = [];
    if (Array.isArray(raw)) {
        for (const x of raw) {
            if (!x || typeof x !== 'object') continue;
            const row = /** @type {Record<string, unknown>} */ (x);
            const typeRaw = asString(row.type).trim().toLowerCase().replace(/\s+/g, '_');
            if (!isNextActionType(typeRaw)) continue;
            const detail = asString(row.detail).trim();
            items.push({
                type: /** @type {import('./types.js').NextActionType} */ (typeRaw),
                detail,
            });
        }
    }

    const onlyNone =
        items.length === 1 && items[0].type === 'none' && items[0].detail === '';
    if (onlyNone) {
        return { next_actions: [], next_action: '' };
    }

    items = items.filter((i) => i.type !== 'none');

    const legacy = legacyNextAction.trim();
    if (items.length === 0 && legacy) {
        const parts = legacy.split(',').map((s) => s.trim()).filter(Boolean);
        for (const p of parts) {
            const typeRaw = p.toLowerCase().replace(/\s+/g, '_');
            if (isNextActionType(typeRaw) && typeRaw !== 'none') {
                items.push({
                    type: /** @type {import('./types.js').NextActionType} */ (typeRaw),
                    detail: '',
                });
            }
        }
    }

    const next_action = items.map((i) => i.type).join(',');
    return { next_actions: items, next_action };
}

/**
 * @param {unknown} v
 * @returns {string}
 */
function asString(v) {
    if (typeof v === 'string') return v;
    if (v == null) return '';
    return String(v);
}

/**
 * @param {unknown} v
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampInt(v, min, max) {
    const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0;
    return Math.min(max, Math.max(min, n));
}

/**
 * Skill / overall: 0–10, max one decimal place.
 * @param {unknown} v
 * @returns {number}
 */
function clampScore0to10(v) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
    const x = Math.min(10, Math.max(0, v));
    return Math.round(x * 10) / 10;
}

/**
 * Guideline group score: 0–5 (prompt uses 1–5 for observed; 0 allowed for placeholders).
 * @param {unknown} v
 * @returns {number}
 */
function clampGuidelineScore(v) {
    return clampInt(v, 0, 5);
}

/**
 * @param {unknown} v
 * @returns {import('./types.js').SuzukiGuidelineStatus}
 */
function normalizeGuidelineStatus(v) {
    const s = asString(v).trim();
    if (GUIDELINE_STATUSES.includes(/** @type {import('./types.js').SuzukiGuidelineStatus} */ (s))) {
        return /** @type {import('./types.js').SuzukiGuidelineStatus} */ (s);
    }
    return 'not_observed';
}

/**
 * @param {unknown} raw
 * @returns {import('./types.js').SuzukiGuidelineScoreEntry}
 */
function normalizeGuidelineEntry(raw) {
    if (!raw || typeof raw !== 'object') {
        return {
            score: 0,
            status: 'not_observed',
            evidence: '',
            coaching_tip: '',
        };
    }
    const e = /** @type {Record<string, unknown>} */ (raw);
    return {
        score: clampGuidelineScore(e.score),
        status: normalizeGuidelineStatus(e.status),
        evidence: asString(e.evidence),
        coaching_tip: asString(e.coaching_tip),
    };
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function normalizeStringArray(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((x) => asString(x).trim())
        .filter((s) => s.length > 0);
}

/**
 * @param {unknown} raw
 * @returns {import('./types.js').SuzukiWhatToSayInsteadItem[]}
 */
function normalizeWhatToSayInstead(raw) {
    if (!Array.isArray(raw)) return [];
    /** @type {import('./types.js').SuzukiWhatToSayInsteadItem[]} */
    const out = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const o = /** @type {Record<string, unknown>} */ (item);
        const situation = asString(o.situation).trim();
        const better_phrase = asString(o.better_phrase).trim();
        if (!situation && !better_phrase) continue;
        out.push({ situation, better_phrase });
    }
    return out;
}

/**
 * @param {unknown} raw
 * @returns {import('./types.js').SuzukiFeedback}
 */
function normalizeSuzukiFeedback(raw) {
    if (!raw || typeof raw !== 'object') {
        return emptySuzukiFeedback();
    }
    const s = /** @type {Record<string, unknown>} */ (raw);

    /** @type {Record<string, import('./types.js').SuzukiGuidelineScoreEntry>} */
    const guideline_scores = {};
    const gs = s.guideline_scores;
    if (gs && typeof gs === 'object') {
        const g = /** @type {Record<string, unknown>} */ (gs);
        for (const key of GUIDELINE_KEYS) {
            guideline_scores[key] = normalizeGuidelineEntry(g[key]);
        }
    } else {
        for (const key of GUIDELINE_KEYS) {
            guideline_scores[key] = normalizeGuidelineEntry(undefined);
        }
    }

    const skill = s.skill_breakdown && typeof s.skill_breakdown === 'object'
        ? /** @type {Record<string, unknown>} */ (s.skill_breakdown)
        : {};

    return {
        guideline_scores,
        what_you_did_well: normalizeStringArray(s.what_you_did_well),
        improve_next: normalizeStringArray(s.improve_next),
        what_to_say_instead: normalizeWhatToSayInstead(s.what_to_say_instead),
        skill_breakdown: {
            product_knowledge: clampScore0to10(skill.product_knowledge),
            negotiation: clampScore0to10(skill.negotiation),
            closing: clampScore0to10(skill.closing),
        },
        coaching_insight: asString(s.coaching_insight).trim(),
        overall_score: clampScore0to10(s.overall_score),
    };
}

/**
 * @returns {import('./types.js').SuzukiFeedback}
 */
function emptySuzukiFeedback() {
    /** @type {Record<string, import('./types.js').SuzukiGuidelineScoreEntry>} */
    const guideline_scores = {};
    for (const key of GUIDELINE_KEYS) {
        guideline_scores[key] = normalizeGuidelineEntry(undefined);
    }
    return {
        guideline_scores,
        what_you_did_well: [],
        improve_next: [],
        what_to_say_instead: [],
        skill_breakdown: {
            product_knowledge: 0,
            negotiation: 0,
            closing: 0,
        },
        coaching_insight: '',
        overall_score: 0,
    };
}

/**
 * @param {unknown} obj
 * @returns {import('./types.js').CallAnalysisResult}
 */
export function validateCallAnalysisResult(obj) {
    if (!obj || typeof obj !== 'object') {
        throw new Error('Analysis result is not an object');
    }
    const o = /** @type {Record<string, unknown>} */ (obj);

    const outputFields = [
        'call_outcome',
        'interest_level',
        'customer_use_case',
        'goods_type',
        'customer_drivers',
        'summary',
    ];

    /** @type {Record<string, string>} */
    const normalized = {};
    for (const field of outputFields) {
        normalized[field] = typeof o[field] === 'string' ? o[field] : '';
    }

    const legacyNextAction = typeof o.next_action === 'string' ? o.next_action : '';
    const { next_actions, next_action } = normalizeNextActions(o.next_actions, legacyNextAction);

    return {
        call_outcome: normalized.call_outcome,
        interest_level: normalized.interest_level,
        customer_use_case: normalized.customer_use_case,
        goods_type: normalized.goods_type,
        customer_drivers: normalized.customer_drivers,
        summary: normalized.summary,
        next_actions,
        next_action,
        suzuki_feedback: normalizeSuzukiFeedback(o.suzuki_feedback),
    };
}

/**
 * Details-only LLM output: normalize Tasks 1–7 and omit suzuki_feedback entirely.
 * @param {unknown} obj
 * @returns {import('./types.js').CallDetailsResult}
 */
export function validateCallDetailsResult(obj) {
    if (!obj || typeof obj !== 'object') {
        throw new Error('Details result is not an object');
    }
    const o = /** @type {Record<string, unknown>} */ (obj);

    const outputFields = [
        'call_outcome',
        'interest_level',
        'customer_use_case',
        'goods_type',
        'customer_drivers',
        'summary',
    ];

    /** @type {Record<string, string>} */
    const normalized = {};
    for (const field of outputFields) {
        normalized[field] = typeof o[field] === 'string' ? o[field] : '';
    }

    const legacyNextAction = typeof o.next_action === 'string' ? o.next_action : '';
    const { next_actions, next_action } = normalizeNextActions(o.next_actions, legacyNextAction);

    return {
        call_outcome: normalized.call_outcome,
        interest_level: normalized.interest_level,
        customer_use_case: normalized.customer_use_case,
        goods_type: normalized.goods_type,
        customer_drivers: normalized.customer_drivers,
        summary: normalized.summary,
        next_actions,
        next_action,
    };
}

/**
 * Feedback-only LLM output: normalize just the coaching block.
 * @param {unknown} obj
 * @returns {{ suzuki_feedback: import('./types.js').SuzukiFeedback }}
 */
export function validateCallFeedbackResult(obj) {
    if (!obj || typeof obj !== 'object') {
        throw new Error('Feedback result is not an object');
    }
    const o = /** @type {Record<string, unknown>} */ (obj);
    return {
        suzuki_feedback: normalizeSuzukiFeedback(o.suzuki_feedback),
    };
}

/**
 * @param {unknown} speaker
 * @returns {'agent' | 'customer'}
 */
function normalizeTranscriptSpeaker(speaker) {
    const s = asString(speaker).trim().toLowerCase();
    if (s === 'customer') return 'customer';
    return 'agent';
}

/**
 * @param {unknown} raw
 * @returns {import('./types.js').CallTranscriptSegment[]}
 */
function normalizeTranscriptSegments(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const row = /** @type {Record<string, unknown>} */ (item);
        const text = asString(row.text).trim();
        if (!text) continue;
        out.push({
            time: asString(row.time).trim(),
            speaker: normalizeTranscriptSpeaker(row.speaker),
            text,
        });
    }
    return out;
}

/**
 * @param {import('./types.js').CallTranscriptSegment[]} segments
 */
function transcriptTextFromSegments(segments) {
    return segments
        .map((segment) => {
            const label = segment.speaker === 'customer' ? 'Customer' : 'Agent';
            const time = segment.time ? `${segment.time} ` : '';
            return `${time}${label}: ${segment.text}`;
        })
        .join('\n');
}

/**
 * Transcript-only LLM output.
 * @param {unknown} obj
 * @returns {import('./types.js').CallTranscriptResult}
 */
export function validateCallTranscriptResult(obj) {
    if (!obj || typeof obj !== 'object') {
        throw new Error('Transcript result is not an object');
    }
    const o = /** @type {Record<string, unknown>} */ (obj);
    const segments = normalizeTranscriptSegments(o.segments);
    const transcript = asString(o.transcript).trim() || transcriptTextFromSegments(segments);
    return {
        transcript,
        segments,
    };
}
