import { expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createGitHubClient } from "./client";

const runIntegrationTest =
  process.env.RUN_GITHUB_INTEGRATION === "1" ? it : it.skip;

runIntegrationTest(
  "fetches a public repository and its README from GitHub",
  async () => {
    const repository = { owner: "vercel", repo: "next.js" };
    const client = createGitHubClient();

    const metadata = await client.getRepository(repository);
    const readme = await client.getReadme(repository, metadata.defaultBranch);

    expect(metadata.fullName.toLowerCase()).toBe("vercel/next.js");
    expect(metadata.defaultBranch.length).toBeGreaterThan(0);
    expect(readme).toContain("Next.js");
  },
  20_000,
);
