/**
 * Optional call metadata injected into all call-analysis prompts.
 * @param {Record<string, unknown>} [metadata]
 */
export function buildCallAnalysisMetaBlock(metadata) {
    return metadata && Object.keys(metadata).length > 0
        ? `\nCall metadata (JSON, for context only — prioritize what you hear in the audio):\n${JSON.stringify(metadata, null, 2)}\n`
        : '';
}

/**
 * Full analysis: Tasks 1–8 and complete JSON shape (combined call details + feedback).
 * @param {Record<string, unknown>} [metadata]
 */
export function buildCallAnalysisPromptFull(metadata) {
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


      Task 1:
      Classify the final outcome of the call.

      Allowed values:
      interested
      callback_requested
      dealership_visit_planned
      not_interested
      wrong_number
      busy
      test_drive_requested

      Instructions:
      Choose the best matching outcome based on the conversation.
      If unclear, return "".

      Output:
      One value only.


      Task 2:
      Determine the customer’s level of interest.

      Allowed values:
      high
      medium
      low

      Instructions:
      High: strong intent, agrees to next step
      Medium: engaged but not committed
      Low: hesitant or minimal engagement
      If unclear, return ""

      Output:
      One value only.


      Task 3:
      Identify how the customer plans to use the vehicle.

      Allowed values:
      goods_transport
      delivery
      business_use
      personal_use
      mixed

      Instructions:
      Choose based on stated usage.
      If unclear, return "".

      Output:
      One value only.


      Task 4:
      Extract the type of goods the customer plans to transport.

      Instructions:
      Return short phrase (e.g., furniture, vegetables, construction material).
      If not mentioned, return "".

      Output:
      Text only.


      Task 5:
      Extract key customer drivers (motivations or concerns).

      Allowed tags (comma-separated):
      needs_high_capacity
      cost_sensitive
      wants_low_maintenance
      comparing_granmax
      comparing_formo
      concerned_about_mileage
      durability_focus
      comfort_focus
      just_exploring

      Instructions:
      Select only relevant tags.
      Multiple tags allowed.
      If none found, return "".

      Output:
      Comma-separated values only.


      Task 6:
      Generate a short summary of the conversation.

      Instructions:
      Keep it 2–3 lines.
      Include:
        - use case
        - Objections or drivers
        - next step (if any)
      Do not add new information.
      If insufficient data, return "".

      Task 7:
      Identify the next action(s) agreed during the call, with concrete details from the conversation.

      Allowed "type" values (use exactly these slugs):
      dealership_visit
      test_drive
      callback
      info_request
      none

      Instructions:
      Return a JSON array "next_actions". Each item must be an object:
        - "type": one of the allowed values above
        - "detail": short natural-language description of what was agreed (who does what, when, where) using only facts stated on the call
      Examples of good detail:
        - "Schedule test drive for next Monday morning at the downtown showroom"
        - "Call customer back Tuesday after 5 PM with finance options"
      If multiple next steps exist, include multiple objects (one per distinct action).
      Use type "info_request" when the customer asked for more details, documents, or information; put the topic in "detail".
      If no clear next step, return an empty array [] (do not use "none" in that case).
      If the only outcome is explicitly no follow-up, use a single item: { "type": "none", "detail": "" }.

      Example "next_actions" (illustrative shape only; use real facts from this call):
      [
        { "type": "test_drive", "detail": "Schedule test drive next Monday 10 AM at Main Road showroom" },
        { "type": "callback", "detail": "Agent to call Tuesday evening with EMI and exchange-offer breakdown" }
      ]

      Output:
      Array only, in the final JSON field "next_actions".

      Task 8: 
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
      Include all top-level keys from Tasks 1–7 ("call_outcome", "interest_level", "customer_use_case", "goods_type", "customer_drivers", "summary", "next_actions") plus "suzuki_feedback" as defined in Task 8. Use "" or [] where a task says the value is missing or unclear.


      Final Output Format (JSON):


      {
        "call_outcome": "",
        "interest_level": "",
        "customer_use_case": "",
        "goods_type": "",
        "customer_drivers": "",
        "summary": "",
        "next_actions": [
          {
            "type": "test_drive",
            "detail": "Schedule test drive for next Monday"
          }
        ],
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
