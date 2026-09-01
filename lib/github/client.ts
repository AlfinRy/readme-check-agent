import "server-only";

import { z } from "zod";

import type { GitHubRepo } from "./repo-url";

const GITHUB_API_BASE_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";
const DEFAULT_TIMEOUT_MS = 10_000;

const repositorySchema = z.object({
  name: z.string().min(1),
  full_name: z.string().min(3),
  private: z.boolean(),
  html_url: z.url(),
  default_branch: z.string().min(1),
  owner: z.object({
    login: z.string().min(1),
  }),
});

const treeSchema = z.object({
  sha: z.string().min(1),
  truncated: z.boolean(),
  tree: z.array(
    z.object({
      path: z.string().min(1),
      type: z.enum(["blob", "tree", "commit"]),
      sha: z.string().min(1),
      size: z.number().int().nonnegative().optional(),
    }),
  ),
});

export type RepositoryMetadata = {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  defaultBranch: string;
};

export type GitTreeEntry = z.infer<typeof treeSchema>["tree"][number];

export type GitTree = {
  sha: string;
  truncated: boolean;
  entries: GitTreeEntry[];
};

export type GitHubClientErrorCode =
  | "REPOSITORY_NOT_FOUND"
  | "PRIVATE_REPOSITORY"
  | "README_NOT_FOUND"
  | "RATE_LIMITED"
  | "INVALID_RESPONSE"
  | "GITHUB_UNAVAILABLE";

type GitHubClientErrorOptions = {
  retryAt?: Date;
  cause?: unknown;
};

export class GitHubClientError extends Error {
  public readonly retryAt?: Date;

  constructor(
    public readonly code: GitHubClientErrorCode,
    message: string,
    options: GitHubClientErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "GitHubClientError";
    this.retryAt = options.retryAt;
  }
}

type GitHubClientOptions = {
  token?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export function createGitHubClient(options: GitHubClientOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const token = options.token?.trim() || process.env.GITHUB_TOKEN?.trim();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function getRepository(
    repository: GitHubRepo,
  ): Promise<RepositoryMetadata> {
    const response = await request(
      `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`,
      "application/vnd.github+json",
    );

    if (!response.ok) {
      throw createResponseError(response, "repository");
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch (cause) {
      throw invalidResponse(cause);
    }

    const parsed = repositorySchema.safeParse(payload);

    if (!parsed.success) {
      throw invalidResponse(parsed.error);
    }

    if (parsed.data.private) {
      throw new GitHubClientError(
        "PRIVATE_REPOSITORY",
        "Private repositories are not supported.",
      );
    }

    return {
      owner: parsed.data.owner.login,
      name: parsed.data.name,
      fullName: parsed.data.full_name,
      htmlUrl: parsed.data.html_url,
      defaultBranch: parsed.data.default_branch,
    };
  }

  async function getReadme(
    repository: GitHubRepo,
    ref?: string,
  ): Promise<string> {
    const query = createRefQuery(ref);
    const response = await request(
      `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/readme${query}`,
      "application/vnd.github.raw+json",
    );

    if (!response.ok) {
      throw createResponseError(response, "readme");
    }

    return readTextResponse(response);
  }

  async function getTree(
    repository: GitHubRepo,
    ref: string,
  ): Promise<GitTree> {
    const response = await request(
      `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
      "application/vnd.github+json",
    );

    if (!response.ok) {
      throw createResponseError(response, "tree");
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch (cause) {
      throw invalidResponse(cause);
    }

    const parsed = treeSchema.safeParse(payload);

    if (!parsed.success) {
      throw invalidResponse(parsed.error);
    }

    return {
      sha: parsed.data.sha,
      truncated: parsed.data.truncated,
      entries: parsed.data.tree,
    };
  }

  async function getFileContent(
    repository: GitHubRepo,
    path: string,
    ref?: string,
  ): Promise<string> {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const query = createRefQuery(ref);
    const response = await request(
      `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/contents/${encodedPath}${query}`,
      "application/vnd.github.raw+json",
    );

    if (!response.ok) {
      throw createResponseError(response, "content");
    }

    return readTextResponse(response);
  }

  async function request(path: string, accept: string) {
    const headers = new Headers({
      Accept: accept,
      "User-Agent": "ReadmeCheck-Agent",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    });

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    try {
      return await fetchImpl(`${GITHUB_API_BASE_URL}${path}`, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      if (cause instanceof GitHubClientError) {
        throw cause;
      }

      throw new GitHubClientError(
        "GITHUB_UNAVAILABLE",
        "GitHub could not be reached. Try again shortly.",
        { cause },
      );
    }
  }

  return { getRepository, getReadme, getTree, getFileContent };
}

function createResponseError(
  response: Response,
  resource: "repository" | "readme" | "tree" | "content",
) {
  if (isRateLimited(response)) {
    return new GitHubClientError(
      "RATE_LIMITED",
      "GitHub API rate limit reached. Try again after the limit resets.",
      { retryAt: getRetryAt(response) },
    );
  }

  if (response.status === 404) {
    if (resource === "readme") {
      return new GitHubClientError(
        "README_NOT_FOUND",
        "This repository does not have a README on its default branch.",
      );
    }

    if (resource === "repository") {
      return new GitHubClientError(
        "REPOSITORY_NOT_FOUND",
        "Repository not found. It may be private or unavailable.",
      );
    }

    return new GitHubClientError(
      "GITHUB_UNAVAILABLE",
      "Repository data could not be read from GitHub.",
    );
  }

  return new GitHubClientError(
    "GITHUB_UNAVAILABLE",
    "GitHub returned an unexpected response. Try again shortly.",
  );
}

function createRefQuery(ref?: string) {
  if (!ref) {
    return "";
  }

  const params = new URLSearchParams({ ref });
  return `?${params.toString()}`;
}

async function readTextResponse(response: Response) {
  try {
    return await response.text();
  } catch (cause) {
    throw invalidResponse(cause);
  }
}

function isRateLimited(response: Response) {
  return (
    (response.status === 403 || response.status === 429) &&
    (response.headers.get("x-ratelimit-remaining") === "0" ||
      response.headers.has("retry-after") ||
      response.status === 429)
  );
}

function getRetryAt(response: Response) {
  const resetAt = Number(response.headers.get("x-ratelimit-reset"));

  if (Number.isFinite(resetAt) && resetAt > 0) {
    return new Date(resetAt * 1_000);
  }

  const retryAfter = Number(response.headers.get("retry-after"));

  if (Number.isFinite(retryAfter) && retryAfter >= 0) {
    return new Date(Date.now() + retryAfter * 1_000);
  }

  return undefined;
}

function invalidResponse(cause: unknown) {
  return new GitHubClientError(
    "INVALID_RESPONSE",
    "GitHub returned data in an unexpected format.",
    { cause },
  );
}
