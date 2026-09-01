import { expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AuditResponse } from "@/lib/agent/schema";
import { createGitHubClient } from "@/lib/github/client";
import {
  collectRepositoryEvidence,
  type RepositoryEvidence,
} from "@/lib/github/evidence";

const runEvaluation = process.env.RUN_AI_EVALUATION === "1" ? it : it.skip;

const cleanEvidence: RepositoryEvidence = {
  treeSha: "clean-tree",
  paths: ["package.json", "src", "src/index.ts"],
  truncated: false,
  manifest: {
    path: "package.json",
    content: JSON.stringify({
      scripts: { dev: "next dev", build: "next build" },
      engines: { node: ">=20" },
    }),
    truncated: false,
  },
  changelog: null,
};

const outdatedEvidence: RepositoryEvidence = {
  treeSha: "outdated-tree",
  paths: ["package.json", "src", "src/index.ts"],
  truncated: false,
  manifest: {
    path: "package.json",
    content: JSON.stringify({
      scripts: { dev: "next dev", build: "next build" },
      engines: { node: ">=20" },
    }),
    truncated: false,
  },
  changelog: {
    path: "CHANGELOG.md",
    content: "# 2.0.0\n\nDropped support for Node.js versions below 20.",
    truncated: false,
  },
};

runEvaluation(
  "evaluates conservative, outdated, and public repository cases",
  async () => {
    const { auditRepository } = await import("@/lib/agent/audit");
    const clean = await auditRepository({
      repository: {
        fullName: "fixtures/readme-in-sync",
        defaultBranch: "main",
      },
      readme:
        "# Readme in sync\n\n## Requirements\n\nNode.js 20 or newer is required.\n\n## Development\n\nRun `npm run dev` to start the development server.",
      evidence: cleanEvidence,
      reasoning: "medium",
    });

    await delay(20_000);

    const outdatedMedium = await auditRepository({
      repository: {
        fullName: "fixtures/outdated-readme",
        defaultBranch: "main",
      },
      readme:
        "# Outdated README\n\n## Requirements\n\nNode.js 16 is required.\n\n## Development\n\nRun `npm start` to launch the development server.",
      evidence: outdatedEvidence,
      reasoning: "medium",
    });

    await delay(20_000);

    const outdatedLow = await auditRepository({
      repository: {
        fullName: "fixtures/outdated-readme",
        defaultBranch: "main",
      },
      readme:
        "# Outdated README\n\n## Requirements\n\nNode.js 16 is required.\n\n## Development\n\nRun `npm start` to launch the development server.",
      evidence: outdatedEvidence,
      reasoning: "low",
    });

    await delay(20_000);

    const repository = { owner: "vercel", repo: "next.js" };
    const client = createGitHubClient();
    const metadata = await client.getRepository(repository);
    const [readmeContent, evidence] = await Promise.all([
      client.getReadme(repository, metadata.defaultBranch),
      collectRepositoryEvidence({
        client,
        repository,
        ref: metadata.defaultBranch,
      }),
    ]);
    const publicRepository = await auditRepository({
      repository: {
        fullName: metadata.fullName,
        defaultBranch: metadata.defaultBranch,
      },
      readme: readmeContent.slice(0, 80_000),
      readmeTruncated: readmeContent.length > 80_000,
      evidence,
      reasoning: "medium",
    });

    console.info(
      JSON.stringify(
        {
          clean: summarize(clean),
          outdatedMedium: summarize(outdatedMedium),
          outdatedLow: summarize(outdatedLow),
          publicRepository: summarize(publicRepository),
        },
        null,
        2,
      ),
    );

    expect(clean.findings).toHaveLength(0);
    expect(outdatedMedium.findings.length).toBeGreaterThanOrEqual(1);
    expect(outdatedLow.findings.length).toBeGreaterThanOrEqual(1);
    expect(
      outdatedMedium.findings.every(
        (finding) => finding.section && finding.issue && finding.evidence,
      ),
    ).toBe(true);
    expect(publicRepository.findings.length).toBeLessThanOrEqual(20);
  },
  180_000,
);

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function summarize(audit: AuditResponse) {
  return {
    count: audit.findings.length,
    sections: audit.findings.map((finding) => finding.section),
    confidences: audit.findings.map((finding) => finding.confidence),
    message: audit.message,
  };
}
