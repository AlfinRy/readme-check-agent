import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createGitHubClient,
  GitHubClientError,
  type GitHubClientErrorCode,
} from "./client";

const repository = { owner: "vercel", repo: "next.js" };
const repositoryPayload = {
  name: "next.js",
  full_name: "vercel/next.js",
  private: false,
  html_url: "https://github.com/vercel/next.js",
  default_branch: "canary",
  owner: { login: "vercel" },
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("createGitHubClient", () => {
  it("fetches and normalizes public repository metadata", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(repositoryPayload),
    );
    const client = createGitHubClient({ fetchImpl });

    await expect(client.getRepository(repository)).resolves.toEqual({
      owner: "vercel",
      name: "next.js",
      fullName: "vercel/next.js",
      htmlUrl: "https://github.com/vercel/next.js",
      defaultBranch: "canary",
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers);

    expect(url).toBe("https://api.github.com/repos/vercel/next.js");
    expect(headers.get("accept")).toBe("application/vnd.github+json");
    expect(headers.get("x-github-api-version")).toBe("2026-03-10");
    expect(headers.get("user-agent")).toBe("ReadmeCheck-Agent");
    expect(headers.has("authorization")).toBe(false);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("uses an optional server-side GitHub token", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(repositoryPayload),
    );
    const client = createGitHubClient({ fetchImpl, token: "github-token" });

    await client.getRepository(repository);

    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer github-token");
  });

  it("fetches raw README content from the selected branch", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("# Next.js\n"));
    const client = createGitHubClient({ fetchImpl });

    await expect(client.getReadme(repository, "feature/docs")).resolves.toBe(
      "# Next.js\n",
    );

    const [url, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(url).toBe(
      "https://api.github.com/repos/vercel/next.js/readme?ref=feature%2Fdocs",
    );
    expect(headers.get("accept")).toBe("application/vnd.github.raw+json");
  });

  it("rejects private repositories returned through an optional token", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ ...repositoryPayload, private: true }),
    );
    const client = createGitHubClient({ fetchImpl });

    await expectErrorCode(
      client.getRepository(repository),
      "PRIVATE_REPOSITORY",
    );
  });

  it.each<["repository" | "readme", GitHubClientErrorCode]>([
    ["repository", "REPOSITORY_NOT_FOUND"],
    ["readme", "README_NOT_FOUND"],
  ])("normalizes a missing %s", async (resource, expectedCode) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }));
    const client = createGitHubClient({ fetchImpl });
    const request =
      resource === "repository"
        ? client.getRepository(repository)
        : client.getReadme(repository);

    await expectErrorCode(request, expectedCode);
  });

  it("normalizes primary rate limits and exposes their reset time", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 403,
        headers: {
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": "1788253200",
        },
      }),
    );
    const client = createGitHubClient({ fetchImpl });

    const error = await getClientError(client.getRepository(repository));

    expect(error.code).toBe("RATE_LIMITED");
    expect(error.retryAt).toEqual(new Date(1_788_253_200_000));
  });

  it("normalizes secondary rate limits", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: { "retry-after": "60" },
      }),
    );
    const client = createGitHubClient({ fetchImpl });

    await expectErrorCode(client.getRepository(repository), "RATE_LIMITED");
  });

  it("normalizes upstream failures", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 503 }));
    const client = createGitHubClient({ fetchImpl });

    await expectErrorCode(
      client.getRepository(repository),
      "GITHUB_UNAVAILABLE",
    );
  });

  it("normalizes network failures", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("network unavailable"));
    const client = createGitHubClient({ fetchImpl });

    await expectErrorCode(
      client.getRepository(repository),
      "GITHUB_UNAVAILABLE",
    );
  });

  it("rejects malformed repository responses", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ default_branch: "main" }));
    const client = createGitHubClient({ fetchImpl });

    await expectErrorCode(
      client.getRepository(repository),
      "INVALID_RESPONSE",
    );
  });
});

async function expectErrorCode(
  promise: Promise<unknown>,
  code: GitHubClientErrorCode,
) {
  await expect(promise).rejects.toEqual(
    expect.objectContaining<Partial<GitHubClientError>>({
      name: "GitHubClientError",
      code,
    }),
  );
}

async function getClientError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(GitHubClientError);
    return error as GitHubClientError;
  }

  throw new Error("Expected GitHub client request to fail.");
}
