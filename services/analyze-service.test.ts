import { afterEach, describe, expect, it, vi } from "vitest";

import { analyzeRepository, AnalyzeApiError } from "./analyze-service";

const successPayload = {
  repository: {
    owner: "owner",
    name: "repo",
    fullName: "owner/repo",
    htmlUrl: "https://github.com/owner/repo",
    defaultBranch: "main",
  },
  analysis: { findings: [], message: "No outdated sections detected." },
  context: {
    partial: true,
    pathsAnalyzed: 12,
    manifestPath: "package.json",
    changelogPath: null,
  },
  model: "minimax/minimax-m3-free",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analyzeRepository", () => {
  it("posts the repository URL and returns the analysis", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(successPayload),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      analyzeRepository("https://github.com/owner/repo"),
    ).resolves.toEqual(successPayload);
    expect(fetchMock).toHaveBeenCalledWith("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl: "https://github.com/owner/repo" }),
      cache: "no-store",
    });
  });

  it("throws a typed API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "GITHUB_RATE_LIMITED",
              message: "Try later.",
              retryAt: "2026-09-01T10:00:00.000Z",
            },
          },
          { status: 429 },
        ),
      ),
    );

    const error = await getAnalyzeError(
      analyzeRepository("https://github.com/owner/repo"),
    );

    expect(error).toMatchObject({
      code: "GITHUB_RATE_LIMITED",
      message: "Try later.",
      status: 429,
      retryAt: "2026-09-01T10:00:00.000Z",
    });
  });

  it("uses a safe fallback for a malformed server error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("Bad gateway", { status: 502 })),
    );

    const error = await getAnalyzeError(
      analyzeRepository("https://github.com/owner/repo"),
    );

    expect(error.code).toBe("UNEXPECTED_RESPONSE");
    expect(error.message).not.toContain("Bad gateway");
  });

  it("normalizes network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("offline")),
    );

    const error = await getAnalyzeError(
      analyzeRepository("https://github.com/owner/repo"),
    );

    expect(error).toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });
});

async function getAnalyzeError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(AnalyzeApiError);
    return error as AnalyzeApiError;
  }

  throw new Error("Expected analysis request to fail.");
}
