import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRepository: vi.fn(),
  getReadme: vi.fn(),
  getTree: vi.fn(),
  getFileContent: vi.fn(),
  collectRepositoryEvidence: vi.fn(),
  auditRepository: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/github/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/github/client")>()),
  createGitHubClient: () => ({
    getRepository: mocks.getRepository,
    getReadme: mocks.getReadme,
    getTree: mocks.getTree,
    getFileContent: mocks.getFileContent,
  }),
}));
vi.mock("@/lib/github/evidence", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/github/evidence")>()),
  collectRepositoryEvidence: mocks.collectRepositoryEvidence,
}));
vi.mock("@/lib/agent/audit", () => ({
  auditRepository: mocks.auditRepository,
}));

import { AUDIT_MODEL_ID } from "@/lib/ai/gateway";
import { GitHubClientError } from "@/lib/github/client";

import { POST } from "./route";

const metadata = {
  owner: "owner",
  name: "repo",
  fullName: "owner/repo",
  htmlUrl: "https://github.com/owner/repo",
  defaultBranch: "main",
};

const evidence = {
  treeSha: "tree-sha",
  paths: ["package.json", "src", "src/index.ts"],
  truncated: true,
  manifest: {
    path: "package.json",
    content: '{"name":"repo"}',
    truncated: false,
  },
  changelog: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getRepository.mockResolvedValue(metadata);
  mocks.getReadme.mockResolvedValue("# Demo");
  mocks.collectRepositoryEvidence.mockResolvedValue(evidence);
  mocks.auditRepository.mockResolvedValue({
    findings: [],
    message: "No outdated sections detected.",
  });
});

describe("POST /api/analyze", () => {
  it("orchestrates GitHub evidence and returns a structured audit", async () => {
    const response = await POST(jsonRequest({
      repoUrl: "https://github.com/owner/repo",
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      repository: metadata,
      analysis: {
        findings: [],
        message: "No outdated sections detected.",
      },
      context: {
        partial: true,
        pathsAnalyzed: 3,
        manifestPath: "package.json",
        changelogPath: null,
      },
      model: AUDIT_MODEL_ID,
    });
    expect(mocks.getRepository).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
    });
    expect(mocks.getReadme).toHaveBeenCalledWith(
      { owner: "owner", repo: "repo" },
      "main",
    );
    expect(mocks.collectRepositoryEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        repository: { owner: "owner", repo: "repo" },
        ref: "main",
      }),
    );
    expect(mocks.auditRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        repository: { fullName: "owner/repo", defaultBranch: "main" },
        readme: "# Demo",
        readmeTruncated: false,
        evidence,
      }),
    );
  });

  it.each([
    [new GitHubClientError("REPOSITORY_NOT_FOUND", "Not found"), 404, "REPOSITORY_NOT_FOUND"],
    [new GitHubClientError("PRIVATE_REPOSITORY", "Private"), 422, "PRIVATE_REPOSITORY"],
  ] as const)(
    "maps repository error %s",
    async (error, status, code) => {
      mocks.getRepository.mockRejectedValue(error);

      const response = await POST(
        jsonRequest({ repoUrl: "https://github.com/owner/repo" }),
      );

      expect(response.status).toBe(status);
      expect((await response.json()).error.code).toBe(code);
    },
  );

  it("maps a missing README", async () => {
    mocks.getReadme.mockRejectedValue(
      new GitHubClientError("README_NOT_FOUND", "No README"),
    );

    const response = await POST(
      jsonRequest({ repoUrl: "https://github.com/owner/repo" }),
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("README_NOT_FOUND");
  });

  it("maps GitHub rate limits and reset time", async () => {
    mocks.getRepository.mockRejectedValue(
      new GitHubClientError("RATE_LIMITED", "Rate limited", {
        retryAt: new Date("2026-09-01T10:00:00.000Z"),
      }),
    );

    const response = await POST(
      jsonRequest({ repoUrl: "https://github.com/owner/repo" }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "GITHUB_RATE_LIMITED",
        message: "Rate limited",
        retryAt: "2026-09-01T10:00:00.000Z",
      },
    });
  });

  it.each([
    [new GitHubClientError("GITHUB_UNAVAILABLE", "Unavailable")],
    [new GitHubClientError("INVALID_RESPONSE", "Invalid response")],
  ])("maps an upstream GitHub failure", async (error) => {
    mocks.getRepository.mockRejectedValue(error);

    const response = await POST(
      jsonRequest({ repoUrl: "https://github.com/owner/repo" }),
    );

    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("GITHUB_UNAVAILABLE");
  });

  it("does not expose internal model failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.auditRepository.mockRejectedValue(
      new Error("provider response containing internal details"),
    );

    const response = await POST(
      jsonRequest({ repoUrl: "https://github.com/owner/repo" }),
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: {
        code: "ANALYSIS_FAILED",
        message: "The repository could not be analyzed. Try again shortly.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("internal details");
  });

  it("rejects malformed and non-GitHub repository URLs before API calls", async () => {
    const response = await POST(
      jsonRequest({ repoUrl: "https://gitlab.com/owner/repo" }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe(
      "INVALID_REPOSITORY_URL",
    );
    expect(mocks.getRepository).not.toHaveBeenCalled();
  });

  it.each([
    [
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: "not json",
        headers: { "content-type": "application/json" },
      }),
      400,
      "INVALID_REQUEST",
    ],
    [
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: "repoUrl=value",
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
      415,
      "UNSUPPORTED_MEDIA_TYPE",
    ],
    [
      jsonRequest({ repoUrl: "https://github.com/owner/repo", extra: true }),
      400,
      "INVALID_REQUEST",
    ],
    [
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: "{}",
        headers: {
          "content-type": "application/json",
          "content-length": "3000",
        },
      }),
      413,
      "REQUEST_TOO_LARGE",
    ],
  ])("validates request payloads", async (request, status, code) => {
    const response = await POST(request);

    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
    expect(mocks.getRepository).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
