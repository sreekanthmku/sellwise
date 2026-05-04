/**
 * @typedef {'gemini' | 'openai' | 'none'} LlmProviderId
 */

/**
 * @typedef {object} SentimentAnalysis
 * @property {string} label
 * @property {number} [score]
 * @property {string} summary
 * @property {{ quote: string, reason?: string }[]} [evidence]
 */

/**
 * @typedef {object} SalesFeedback
 * @property {string[]} strengths
 * @property {string[]} improvements
 * @property {string} [overall_assessment]
 */

/**
 * @typedef {object} NextActionItem
 * @property {string} type
 * @property {string} title
 * @property {string} rationale
 * @property {'low'|'medium'|'high'} [priority]
 * @property {string} [due_hint]
 * @property {string} [owner]
 */

/**
 * Structured call-recording analysis (LLM output).
 * @typedef {object} CallAnalysisResult
 * @property {SentimentAnalysis} customer_sentiment
 * @property {SalesFeedback} sales_person_feedback
 * @property {NextActionItem[]} next_action_items
 */

/**
 * @typedef {object} AnalyzeCallAudioInput
 * @property {string} audioPath
 * @property {Record<string, unknown>} [metadata]
 */

export {};
