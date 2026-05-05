/**
 * System instructions + output contract for call recording analysis.
 * @param {Record<string, unknown>} [metadata]
 */
export function buildCallAnalysisPrompt(metadata) {
    const metaBlock =
        metadata && Object.keys(metadata).length > 0
            ? `\nCall metadata (JSON, for context only — prioritize what you hear in the audio):\n${JSON.stringify(metadata, null, 2)}\n`
            : '';

//     return `You are an expert sales quality and customer-experience analyst for phone conversations between a salesperson and a customer.

// Listen to the attached call recording audio and produce a thorough analysis.${metaBlock}

// Respond with a single JSON object ONLY (no markdown fences, no commentary before or after). Use this exact shape:

// {
//   "customer_sentiment": {
//     "label": "negative" | "neutral" | "positive | dissatisfied | frustrated | angry | bored | confused | interested | excited ",
//     "score": <number 1-5, 5 most positive>,
//     "summary": "<2-4 sentences>",
//     "evidence": [
//       { "quote": "<short verbatim or paraphrase from the call>", "reason": "<why this supports the sentiment>" }
//     ]
//   },
//   "sales_person_feedback": {
//     "strengths": ["<bullet>"],
//     "improvements": ["<specific, actionable coaching points>"],
//     "overall_assessment": "<2-5 sentences>"
//   },
//   "next_action_items": [
//     {
//       "type": "<short machine-friendly slug e.g. schedule_service, callback_customer, send_quote, follow_up_internal, escalate, no_action>",
//       "title": "<human-readable title>",
//       "rationale": "<why this action is suggested from the call>",
//       "priority": "low" | "medium" | "high",
//       "due_hint": "<e.g. within 24 hours, in 2 days, after customer confirms>",
//       "owner": "sales" | "service" | "management" | "system"
//     }
//   ]
// }

// Examples:

// --- Positive Call Scenario ---
// 📞 ✅ 1. Positive Sales Call (Conversion Happens)
// Agent (Maruti Suzuki):

// Hello, am I speaking with Mr. Arun?
// Customer:

// Yes, speaking.
// Agent:

// Hi Arun, this is Rahul calling from Maruti Suzuki. You had recently shown interest in a car on our website. Is this a good time to talk?
// Customer:

// Yes, tell me.
// Agent:

// Great. Just to understand better—are you looking for a car for daily commute, family use, or something else?
// Customer:

// Mostly family use and occasional long trips.
// Agent:

// Perfect. For that requirement, many of our customers prefer the Ertiga or Baleno. May I know how many members in your family?
// Customer:

// We are five.
// Agent:

// Then Ertiga would be ideal—more space, very comfortable for long drives, and great mileage as well.
// Customer:

// What’s the mileage like?
// Agent:

// Around 20 km/l for petrol, and higher for CNG. Also, maintenance cost is quite low compared to other brands.
// Customer:

// Okay, sounds good.
// Agent:

// We also have a limited-period offer this month with exchange bonus and easy EMI options. Would you be interested in a quick test drive at your home or nearby showroom?
// Customer:

// Home test drive sounds good.
// Agent:

// Perfect. What time works for you—today evening or tomorrow morning?
// Customer:

// Tomorrow morning.
// Agent:

// Done. I’ll schedule it for you and share details on WhatsApp. After the test drive, I can also help you with exact pricing and offers.
// Customer:

// Okay, thanks.
// Agent:

// Thank you, Arun. Looking forward to helping you choose the right car!

// Expected Output:
// {
//   "customer_sentiment": {
//     "label": "positive",
//     "score": 5,
//     "summary": "The customer shows strong interest throughout the call and is engaged in the discussion. They ask relevant questions and agree to a test drive, indicating high purchase intent. The interaction builds confidence and keeps the customer open to moving forward.",
//     "evidence": [
//       {
//         "quote": "What’s the mileage like?",
//         "reason": "Customer is actively evaluating the product, showing interest"
//       },
//       {
//         "quote": "Home test drive sounds good",
//         "reason": "Indicates clear buying intent and willingness to proceed"
//       }
//     ]
//   },
//   "sales_person_feedback": {
//     "strengths": [
//       "The sales person was really helpful and tried to understand the requirements of the customer properly.",
//       "The sales person was able to answer customer's queries and increase the interest of the customer in the vehicle and provided emi options etc and finally mentioned to share all these details over whatsapp for the customer to check later. This gives the customer time to check details later and doesn't push the customer to take an immediate decision."
//     ],
//     "improvements": [
//       "Could further personalize the recommendation by referencing specific usage scenarios.",
//       "Can reinforce urgency slightly by clearly mentioning offer timelines."
//     ],
//     "overall_assessment": "This was a strong, consultative sales interaction. The sales person effectively understood customer needs, answered questions clearly, and guided the conversation toward a next step. The approach built trust and increased conversion likelihood."
//   },
//   "next_action_items": [
//     {
//       "type": "send_followup_material",
//       "title": "Send vehicle details via WhatsApp",
//       "rationale": "Customer showed interest and expects details to review later.",
//       "priority": "high",
//       "due_hint": "within 24 hours",
//       "owner": "sales"
//     }
//   ]
// }

// --- Negative Call Scenario ---
// Agent:

// Hello, is this Mr. Arun?
// Customer:

// Yes.
// Agent:

// Calling from Maruti Suzuki. You had shown interest in a car.
// Customer:

// Okay…
// Agent:

// We have many cars like Swift, Baleno, Brezza…
// Customer:

// Yeah, I’m just checking options.
// Agent:

// Okay. You can visit showroom.
// Customer:

// Can you tell me which one suits my needs?
// Agent:

// Depends… all are good cars.
// Customer:

// What about price or offers?
// Agent:

// Prices vary. You can check online.
// Customer:

// Alright… I’ll see and decide later.
// Agent:

// Okay.
// (Call ends—no engagement, no next step)

// Expected Output:
// {
//   "customer_sentiment": {
//     "label": "dissatisfied",
//     "score": 2,
//     "summary": "The customer starts with mild curiosity but quickly becomes disengaged due to lack of helpful responses. There is no strong emotional reaction, but interest declines steadily. The conversation ends without any meaningful progress.",
//     "evidence": [
//       {
//         "quote": "I’m just checking options",
//         "reason": "Indicates low initial commitment"
//       },
//       {
//         "quote": "I’ll explore other options",
//         "reason": "Shows disengagement and exit due to poor interaction"
//       }
//     ]
//   },
//   "sales_person_feedback": {
//     "strengths": [
//       "The sales person initiated the call but did not build further engagement."
//     ],
//     "improvements": [
//       "The sales person was not at all helpful with the customer.",
//       "The sales person didn't answer properly to the customer's queries.",
//       "The customer can always check things online but because a call is happening between a sales person and the customer, it's absolutely recommended to solve any and all customer's queries the best possible way -- because this increases the customer's interest in the product which will in turn incrase in sales.",
//       "The sales person must learn how to professionally speak with potential and existing customers and create opportunities for more sales, rather than decreases the opportunities of sales and revenue."
//     ],
//     "overall_assessment": "This interaction represents a missed sales opportunity. The sales person failed to engage, provide value, or guide the customer toward a decision. Significant improvement is needed in communication and customer handling."
//   },
//   "next_action_items": [
//     {
//       "type": "callback_customer",
//       "title": "Re-engage customer with improved approach",
//       "rationale": "Customer dropped due to poor experience and may still be evaluating options.",
//       "priority": "medium",
//       "due_hint": "within 48 hours",
//       "owner": "sales"
//     }
//   ]
// }

// Rules:
// - Base every claim on the audio; if something is unclear, say so in the relevant text and prefer conservative next_action_items.
// - Be professional and constructive in sales_person_feedback (coaching tone, not personal attacks).
// - next_action_items can be an empty array only if truly no follow-up is needed; otherwise include concrete suggested actions.
// - Output must be valid JSON: double-quoted keys and strings, no trailing commas.`;

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
      `
}
