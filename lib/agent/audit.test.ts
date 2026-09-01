import { beforeEach, describe, expect, it, vi } from "vitest";

const generateTextMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText: generateTextMock,
}));

import {
  AUDIT_FALLBACK_MODEL_ID,
  AUDIT_MODEL_ID,
} from "@/lib/ai/gateway";
import type { RepositoryEvidence } from "@/lib/github/evidence";

import { auditRepository } from "./audit";

const evidence: RepositoryEvidence = {
  treeSha: "tree-sha",
  paths: ["package.json", "src"],
  truncated: true,
  manifest: {
    path: "package.json",
    content: '{"scripts":{"dev":"next dev"}}',
    truncated: false,
  },
  changelog: null,
};

beforeEach(() => {
  generateTextMock.mockReset();
});

describe("auditRepository", () => {
  it("requests structured output through the primary model and fallback", async () => {
    const modelOutput = {
      findings: [
        {
          section: "Development",
          issue: "The documented command references a missing script.",
          evidence: "package.json only defines the dev script.",
          confidence: "high",
        },
      ],
      message: "Found 1 likely outdated section.",
    };
    generateTextMock.mockResolvedValue({ output: modelOutput });
    const abortSignal = new AbortController().signal;

    await expect(
      auditRepository({
        repository: { fullName: "owner/repo", defaultBranch: "main" },
        readme: "# Development\nRun npm start.",
        readmeTruncated: true,
        evidence,
        abortSignal,
      }),
    ).resolves.toEqual(modelOutput);

    expect(generateTextMock).toHaveBeenCalledOnce();
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: AUDIT_MODEL_ID,
        reasoning: "medium",
        providerOptions: {
          gateway: { models: [AUDIT_FALLBACK_MODEL_ID] },
        },
        maxOutputTokens: 3_000,
        maxRetries: 1,
        abortSignal,
      }),
    );
    const options = generateTextMock.mock.calls[0][0];
    expect(options.system).toContain("conservative documentation auditor");
    expect(options.prompt).toContain('"readmeContentIsPartial": true');
    expect(options.output).toBeDefined();
  });

  it("uses the canonical message for an empty result", async () => {
    generateTextMock.mockResolvedValue({
      output: { findings: [], message: "Everything seems okay." },
    });

    await expect(
      auditRepository({
        repository: { fullName: "owner/repo", defaultBranch: "main" },
        readme: "# Demo",
        evidence,
      }),
    ).resolves.toEqual({
      findings: [],
      message: "No outdated sections detected.",
    });
  });

  it("rejects an invalid model response", async () => {
    generateTextMock.mockResolvedValue({
      output: {
        findings: [{ section: "Install", confidence: "certain" }],
        message: "Invalid",
      },
    });

    await expect(
      auditRepository({
        repository: { fullName: "owner/repo", defaultBranch: "main" },
        readme: "# Install",
        evidence,
      }),
    ).rejects.toThrow();
  });
});
