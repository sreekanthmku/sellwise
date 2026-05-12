import { buildCallAnalysisMetaBlock } from './callAnalysisShared.js';

/**
 * Call transcript: produce readable, timestamped transcript from the attached audio.
 * @param {Record<string, unknown>} [metadata]
 */
export function buildCallTranscriptPrompt(metadata) {
    const metaBlock = buildCallAnalysisMetaBlock(metadata);

    return `
      You are transcribing a customer call recording for Sellwise.

      Listen to the attached call recording audio and produce a readable transcript.

      ${metaBlock}

      Rules:
      - Return only the JSON object, no preamble, no markdown fences.
      - Use only what is audible in the recording.
      - Do not invent missing words. Use "[inaudible]" for unclear short spans.
      - Keep speaker labels simple: "agent" and "customer".
      - Use approximate timestamps in mm:ss format.
      - If the speaker is uncertain, choose the most likely speaker based on conversation flow.
      - Also include a plain text transcript suitable for UI display.

      Final Output Format (JSON):
      {
        "transcript": "0:00 Agent: ...\\n0:05 Customer: ...",
        "segments": [
          {
            "time": "0:00",
            "speaker": "agent",
            "text": ""
          }
        ]
      }
    `;
}
