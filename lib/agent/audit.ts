import "server-only";

import { generateText, NoObjectGeneratedError, Output } from "ai";

import {
  AUDIT_FALLBACK_MODEL_ID,
  AUDIT_MODEL_ID,
} from "@/lib/ai/gateway";
import type { RepositoryEvidence } from "@/lib/github/evidence";

import {
  buildAuditPrompt,
  DOCUMENTATION_AUDITOR_SYSTEM_PROMPT,
} from "./prompt";
import { auditResponseSchema, type AuditResponse } from "./schema";

const MODEL_TIMEOUT_MS = 40_000;
const MAX_OUTPUT_TOKENS = 3_000;

type AuditRepositoryInput = {
  repository: {
    fullName: string;
    defaultBranch: string;
  };
  readme: string;
  readmeTruncated?: boolean;
  evidence: RepositoryEvidence;
  reasoning?: "low" | "medium";
  abortSignal?: AbortSignal;
};

export async function auditRepository({
  repository,
  readme,
  readmeTruncated = false,
  evidence,
  reasoning = "medium",
  abortSignal = AbortSignal.timeout(MODEL_TIMEOUT_MS),
}: AuditRepositoryInput): Promise<AuditResponse> {
  const generationOptions = {
    model: AUDIT_MODEL_ID,
    system: DOCUMENTATION_AUDITOR_SYSTEM_PROMPT,
    prompt: buildAuditPrompt({
      repository,
      readme,
      readmeTruncated,
      evidence,
    }),
    output: Output.object({
      schema: auditResponseSchema,
      name: "readme_audit",
      description: "Conservative README audit findings backed by repository evidence.",
    }),
    reasoning,
    providerOptions: {
      gateway: {
        models: [AUDIT_FALLBACK_MODEL_ID],
      },
    },
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    maxRetries: 1,
    abortSignal,
  };
  let audit: AuditResponse | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await generateText(generationOptions);
      audit = auditResponseSchema.parse(result.output);
      break;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        const repaired = error.text ? repairAuditOutput(error.text) : null;

        if (repaired) {
          audit = repaired;
          break;
        }

        if (attempt === 0) {
          continue;
        }
      }

      throw error;
    }
  }

  if (!audit) {
    throw new Error("The model did not return a valid audit.");
  }

  if (audit.findings.length === 0) {
    return { findings: [], message: "No outdated sections detected." };
  }

  return audit;
}

export function repairAuditOutput(text: string): AuditResponse | null {
  const jsonText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let value: unknown;

  try {
    value = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (!isRecord(value) || !Array.isArray(value.findings)) {
    return null;
  }

  const normalized = {
    findings: value.findings.map((finding) => {
      if (!isRecord(finding)) {
        return finding;
      }

      return {
        section: finding.section,
        issue: finding.issue ?? finding.contradiction,
        evidence: finding.evidence,
        confidence: finding.confidence,
      };
    }),
    message: value.message,
  };
  const parsed = auditResponseSchema.safeParse(normalized);

  return parsed.success ? parsed.data : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
