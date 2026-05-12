import { buildCallAnalysisMetaBlock } from './callAnalysisShared.js';

/**
 * Call Feedback: system instructions, Task 8, output shape.
 * @param {Record<string, unknown>} [metadata]
 */
export function buildCallFeedbackPrompt(metadata) {
    const metaBlock = buildCallAnalysisMetaBlock(metadata);

    return `
      You are extracting structured information from a customer call conversation.

      Listen to the attached call recording audio and produce a thorough structured information 
      
      ${metaBlock}

      Rules:
      Only use information explicitly mentioned in the conversation.
      Do NOT assume or infer missing details.
      If the information is not clearly available, return "".
      Follow the allowed values exactly where provided.
      Return only the JSON object, no preamble or explanation.
      For Suzuki quality scoring, evaluate only behavior explicitly heard in audio.
      If a behavior is not clearly observed, mark it as "not_observed" and keep evidence as "".
      Do not infer tone, politeness, or listening unless there is clear verbal evidence.
      Use integer scores only where requested.


      Task: 
      Evaluate Suzuki call-quality guidelines and provide coaching feedback.

      Suzuki guideline groups:
      opening_protocol
      tone_and_pace
      two_way_communication
      needs_discovery
      fab_explanation 
      objection_offer_handling
      professionalism_focus
      closing_protocol

      Group expectations:
      opening_protocol: greeting, self-introduction, company name, ask for customer's time and availability.
      tone_and_pace: formal/polite language, calm delivery, not rushed.
      two_way_communication: allows customer to speak, listens, responds to customer comments/signals, avoids interruption.
      needs_discovery: explores customer needs and intended vehicle usage.
      fab_explanation: explains features, advantages, and benefits clearly and links to customer needs.
      objection_offer_handling: answers questions accurately, explains offers/promotions/programs clearly.
      professionalism_focus: organized flow, focused discussion, respectful behavior, efficient call handling.
      closing_protocol: confirms customer understanding, ends politely, thanks customer.


      Instructions:
      Use only information explicitly present in the conversation.
      Do not infer missing behavior.
      If a behavior is not clearly observed, use "not_observed" and evidence as "".
      Keep feedback professional, concise, and actionable.
      Scores must be integers where requested.
      For each guideline group, return:
      score: integer 1-5
      status: one of "met", "partially_met", "not_met", "not_observed"
      evidence: short quote/phrase from call, or ""
      coaching_tip: one actionable sentence
      Also return:
      what_you_did_well: 3-5 bullet-style strings based on observed strengths
      improve_next: 3-5 actionable coaching points
      what_to_say_instead: 2-4 items with:
        - situation
        - better_phrase
      skill_breakdown with integer scores 0-10:
        - product_knowledge
        - negotiation
        - closing
      coaching_insight: 2-4 sentences with manager-style coaching
      overall_score: number 0-10 (float allowed, max 1 decimal place)
      overall_score can be decimal (example: 7.4), but keep only one digit after decimal.


      How your output should look:
      Respond with a single JSON object only (no markdown fences, no commentary before or after).
      The only top-level key is "suzuki_feedback". Its value must include "guideline_scores" with one object per guideline group named in Task 8 (each with score, status, evidence, coaching_tip as specified there), plus "what_you_did_well", "improve_next", "what_to_say_instead", "skill_breakdown", "coaching_insight", and "overall_score" exactly as Task 8 describes.
      Do not include call_outcome, interest_level, or any other top-level keys besides "suzuki_feedback".


      Final Output Format (JSON):


      {
        "suzuki_feedback": {
          "guideline_scores": {
            "opening_protocol": {
              "score": 0,
              "status": "not_observed",
              "evidence": "",
              "coaching_tip": ""
            },
            "tone_and_pace": {
              "score": 0,
              "status": "not_observed",
              "evidence": "",
              "coaching_tip": ""
            },
            "two_way_communication": {
              "score": 0,
              "status": "not_observed",
              "evidence": "",
              "coaching_tip": ""
            },
            "needs_discovery": {
              "score": 0,
              "status": "not_observed",
              "evidence": "",
              "coaching_tip": ""
            },
            "fab_explanation": {
              "score": 0,
              "status": "not_observed",
              "evidence": "",
              "coaching_tip": ""
            },
            "objection_offer_handling": {
              "score": 0,
              "status": "not_observed",
              "evidence": "",
              "coaching_tip": ""
            },
            "professionalism_focus": {
              "score": 0,
              "status": "not_observed",
              "evidence": "",
              "coaching_tip": ""
            },
            "closing_protocol": {
              "score": 0,
              "status": "not_observed",
              "evidence": "",
              "coaching_tip": ""
            }
          },
          "what_you_did_well": [
            ""
          ],
          "improve_next": [
            ""
          ],
          "what_to_say_instead": [
            {
              "situation": "",
              "better_phrase": ""
            }
          ],
          "skill_breakdown": {
            "product_knowledge": 0,
            "negotiation": 0,
            "closing": 0
          },
          "coaching_insight": "",
          "overall_score": 0.0
        }
      }
      `;
}
