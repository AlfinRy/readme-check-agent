import { describe, expect, it } from "vitest";

import { auditResponseSchema } from "./schema";

const validFinding = {
  section: "Installation",
  issue: "The documented install command references a missing script.",
  evidence: "package.json scripts do not contain the documented setup script.",
  confidence: "high" as const,
};

describe("auditResponseSchema", () => {
  it("accepts findings and trims model strings", () => {
    expect(
      auditResponseSchema.parse({
        findings: [{ ...validFinding, section: "  Installation  " }],
        message: "  Found 1 likely outdated section.  ",
      }),
    ).toEqual({
      findings: [validFinding],
      message: "Found 1 likely outdated section.",
    });
  });

  it("accepts a trustworthy empty result", () => {
    expect(
      auditResponseSchema.parse({
        findings: [],
        message: "No outdated sections detected.",
      }),
    ).toEqual({
      findings: [],
      message: "No outdated sections detected.",
    });
  });

  it.each([
    { ...validFinding, section: "" },
    { ...validFinding, issue: "" },
    { ...validFinding, evidence: "" },
    { ...validFinding, confidence: "certain" },
  ])("rejects an invalid finding: %o", (finding) => {
    expect(
      auditResponseSchema.safeParse({ findings: [finding], message: "Result" })
        .success,
    ).toBe(false);
  });

  it("rejects more than 20 findings", () => {
    expect(
      auditResponseSchema.safeParse({
        findings: Array.from({ length: 21 }, () => validFinding),
        message: "Too many findings",
      }).success,
    ).toBe(false);
  });
});
