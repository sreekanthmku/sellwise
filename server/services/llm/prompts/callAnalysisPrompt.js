import { buildCallAnalysisPromptFull } from './callAnalysisShared.js';

/**
 * System instructions + output contract for call recording analysis.
 * @param {Record<string, unknown>} [metadata]
 */
export function buildCallAnalysisPrompt(metadata) {
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

    return buildCallAnalysisPromptFull(metadata);
}

export { buildCallDetailsPrompt } from './callDetailsPrompt.js';
export { buildCallFeedbackPrompt } from './callFeedbackPrompt.js';
export { buildCallTranscriptPrompt } from './callTranscriptPrompt.js';
