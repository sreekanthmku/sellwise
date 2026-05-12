/**
 * @typedef {'gemini' | 'openai' | 'none'} LlmProviderId
 */

/**
 * @typedef {'met' | 'partially_met' | 'not_met' | 'not_observed'} SuzukiGuidelineStatus
 */

/**
 * @typedef {object} SuzukiGuidelineScoreEntry
 * @property {number} score
 * @property {SuzukiGuidelineStatus} status
 * @property {string} evidence
 * @property {string} coaching_tip
 */

/**
 * @typedef {object} SuzukiWhatToSayInsteadItem
 * @property {string} situation
 * @property {string} better_phrase
 */

/**
 * @typedef {'dealership_visit' | 'test_drive' | 'callback' | 'info_request' | 'none'} NextActionType
 */

/**
 * @typedef {object} NextActionItem
 * @property {NextActionType} type
 * @property {string} detail
 */

/**
 * @typedef {object} SuzukiFeedback
 * @property {Record<string, SuzukiGuidelineScoreEntry>} guideline_scores
 * @property {string[]} what_you_did_well
 * @property {string[]} improve_next
 * @property {SuzukiWhatToSayInsteadItem[]} what_to_say_instead
 * @property {{ product_knowledge: number, negotiation: number, closing: number }} skill_breakdown
 * @property {string} coaching_insight
 * @property {number} overall_score
 */

/**
 * Structured call-recording analysis (LLM output).
 * @typedef {object} CallAnalysisResult
 * @property {string} call_outcome
 * @property {string} interest_level
 * @property {string} customer_use_case
 * @property {string} goods_type
 * @property {string} customer_drivers
 * @property {string} summary
 * @property {NextActionItem[]} next_actions
 * @property {string} next_action
 * @property {SuzukiFeedback} suzuki_feedback
 */

/**
 * Details-only call analysis (Tasks 1–7 only).
 * @typedef {object} CallDetailsResult
 * @property {string} call_outcome
 * @property {string} interest_level
 * @property {string} customer_use_case
 * @property {string} goods_type
 * @property {string} customer_drivers
 * @property {string} summary
 * @property {NextActionItem[]} next_actions
 * @property {string} next_action
 */

/**
 * @typedef {object} AnalyzeCallAudioInput
 * @property {string} audioPath
 * @property {Record<string, unknown>} [metadata]
 * @property {'details' | 'feedback' | 'transcript'} [analysisKind]
 */

/**
 * @typedef {object} CallTranscriptSegment
 * @property {string} time
 * @property {'agent' | 'customer'} speaker
 * @property {string} text
 */

/**
 * @typedef {object} CallTranscriptResult
 * @property {string} transcript
 * @property {CallTranscriptSegment[]} segments
 */

export {};
