import { expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createGitHubClient } from "./client";
import { collectRepositoryEvidence } from "./evidence";

const runIntegrationTest =
  process.env.RUN_GITHUB_INTEGRATION === "1" ? it : it.skip;

runIntegrationTest(
  "fetches a public repository and its README from GitHub",
  async () => {
    const repository = { owner: "vercel", repo: "next.js" };
    const client = createGitHubClient();

    const metadata = await client.getRepository(repository);
    const [readme, evidence] = await Promise.all([
      client.getReadme(repository, metadata.defaultBranch),
      collectRepositoryEvidence({
        client,
        repository,
        ref: metadata.defaultBranch,
      }),
    ]);

    expect(metadata.fullName.toLowerCase()).toBe("vercel/next.js");
    expect(metadata.defaultBranch.length).toBeGreaterThan(0);
    expect(readme).toContain("Next.js");
    expect(evidence.paths.length).toBeGreaterThan(0);
    expect(evidence.paths.length).toBeLessThanOrEqual(20);
    expect(evidence.manifest?.path).toBe("package.json");
  },
  20_000,
);
