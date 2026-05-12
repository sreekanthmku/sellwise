import { buildCallAnalysisMetaBlock } from './callAnalysisShared.js';

/**
 * Call Details: system instructions, Tasks 1–7, output shape.
 * @param {Record<string, unknown>} [metadata]
 */
export function buildCallDetailsPrompt(metadata) {
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


      How your output should look:
      Respond with a single JSON object only (no markdown fences, no commentary before or after).
      Top-level keys must match Tasks 1–7 as follows: "call_outcome" from Task 1; "interest_level" from Task 2; "customer_use_case" from Task 3; "goods_type" from Task 4; "customer_drivers" from Task 5 as a comma-separated string; "summary" from Task 6; "next_actions" from Task 7 as an array of objects with "type" and "detail".
      Use "" or [] where a task says the value is missing or unclear. Do not add any other top-level keys.


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
        ]
      }
      `;
}
