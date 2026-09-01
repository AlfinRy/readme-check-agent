import { describe, expect, it } from "vitest";

import {
  parseGitHubRepoUrl,
  RepoUrlValidationError,
  type RepoUrlValidationErrorCode,
} from "./repo-url";

describe("parseGitHubRepoUrl", () => {
  it.each([
    ["https://github.com/vercel/next.js", "vercel", "next.js"],
    ["https://github.com/vercel/next.js/", "vercel", "next.js"],
    ["https://github.com/vercel/next.js.git", "vercel", "next.js"],
    ["https://www.github.com/owner/repo", "owner", "repo"],
    ["https://github.com:443/owner/repo", "owner", "repo"],
    ["  https://github.com/Owner/Repo_Name  ", "Owner", "Repo_Name"],
  ])("parses %s", (url, owner, repo) => {
    expect(parseGitHubRepoUrl(url)).toEqual({ owner, repo });
  });

  it.each<[string, RepoUrlValidationErrorCode]>([
    ["", "EMPTY_URL"],
    ["github.com/owner/repo", "INVALID_URL"],
    ["not a URL", "INVALID_URL"],
    ["http://github.com/owner/repo", "UNSUPPORTED_PROTOCOL"],
    ["ftp://github.com/owner/repo", "UNSUPPORTED_PROTOCOL"],
    ["https://gitlab.com/owner/repo", "UNSUPPORTED_HOST"],
    ["https://github.com.evil.example/owner/repo", "UNSUPPORTED_HOST"],
    ["https://user@github.com/owner/repo", "UNSUPPORTED_HOST"],
    ["https://github.com/owner", "INVALID_REPOSITORY_PATH"],
    ["https://github.com/owner/repo/issues", "INVALID_REPOSITORY_PATH"],
    ["https://github.com/-owner/repo", "INVALID_REPOSITORY_PATH"],
    ["https://github.com/owner-/repo", "INVALID_REPOSITORY_PATH"],
    ["https://github.com/owner/repo%2Fother", "INVALID_REPOSITORY_PATH"],
    ["https://github.com/owner/%E0%A4%A", "INVALID_REPOSITORY_PATH"],
    ["https://github.com/owner/.git", "INVALID_REPOSITORY_PATH"],
  ])("rejects %s with %s", (url, expectedCode) => {
    expect(() => parseGitHubRepoUrl(url)).toThrowError(
      expect.objectContaining<Partial<RepoUrlValidationError>>({
        name: "RepoUrlValidationError",
        code: expectedCode,
      }),
    );
  });
});
