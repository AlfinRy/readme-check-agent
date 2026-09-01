export type GitHubRepo = {
  owner: string;
  repo: string;
};

export type RepoUrlValidationErrorCode =
  | "EMPTY_URL"
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "UNSUPPORTED_HOST"
  | "INVALID_REPOSITORY_PATH";

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const OWNER_PATTERN = /^(?!-)[a-zA-Z0-9-]{1,39}(?<!-)$/;
const REPO_PATTERN = /^(?!\.\.?$)[a-zA-Z0-9._-]{1,100}$/;

export class RepoUrlValidationError extends Error {
  constructor(
    public readonly code: RepoUrlValidationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RepoUrlValidationError";
  }
}

export function parseGitHubRepoUrl(input: string): GitHubRepo {
  const value = input.trim();

  if (!value) {
    throw new RepoUrlValidationError(
      "EMPTY_URL",
      "Enter a public GitHub repository URL.",
    );
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new RepoUrlValidationError(
      "INVALID_URL",
      "Enter a complete URL such as https://github.com/owner/repo.",
    );
  }

  if (url.protocol !== "https:") {
    throw new RepoUrlValidationError(
      "UNSUPPORTED_PROTOCOL",
      "GitHub repository URLs must use HTTPS.",
    );
  }

  if (
    !GITHUB_HOSTS.has(url.hostname.toLowerCase()) ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new RepoUrlValidationError(
      "UNSUPPORTED_HOST",
      "Only public github.com repository URLs are supported.",
    );
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (pathSegments.length !== 2) {
    throw invalidRepositoryPath();
  }

  let owner: string;
  let repo: string;

  try {
    owner = decodeURIComponent(pathSegments[0]);
    repo = decodeURIComponent(pathSegments[1]);
  } catch {
    throw invalidRepositoryPath();
  }

  repo = repo.replace(/\.git$/i, "");

  if (!OWNER_PATTERN.test(owner) || !REPO_PATTERN.test(repo)) {
    throw invalidRepositoryPath();
  }

  return { owner, repo };
}

function invalidRepositoryPath() {
  return new RepoUrlValidationError(
    "INVALID_REPOSITORY_PATH",
    "Use a repository root URL such as https://github.com/owner/repo.",
  );
}
