import "server-only";

import { generateText } from "ai";

export const AUDIT_MODEL_ID = "minimax/minimax-m3-free";
export const AUDIT_FALLBACK_MODEL_ID = "minimax/minimax-m2.7-free";

export async function runGatewaySmokeTest() {
  const result = await generateText({
    model: AUDIT_MODEL_ID,
    prompt:
      "Reply with exactly: Gateway connection verified. Do not add punctuation or explanation.",
    maxOutputTokens: 24,
  });

  return {
    model: AUDIT_MODEL_ID,
    text: result.text.trim(),
    finishReason: result.finishReason,
  };
}
