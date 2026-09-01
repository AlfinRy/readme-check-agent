import { z } from "zod";

export const confidenceSchema = z.enum(["low", "medium", "high"]);

export const findingSchema = z
  .object({
    section: z.string().trim().min(1).max(200),
    issue: z.string().trim().min(1).max(1_000),
    evidence: z.string().trim().min(1).max(2_000),
    confidence: confidenceSchema,
  })
  .strict();

export const auditResponseSchema = z
  .object({
    findings: z.array(findingSchema).max(20),
    message: z.string().trim().min(1).max(300),
  })
  .strict();

export type Confidence = z.infer<typeof confidenceSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type AuditResponse = z.infer<typeof auditResponseSchema>;
