import "server-only";

import type { GitTree, GitTreeEntry } from "./client";
import type { GitHubRepo } from "./repo-url";

const DEFAULT_MAX_PATHS = 20;
const MAX_ALLOWED_PATHS = 20;
const DEFAULT_MAX_FILE_CHARACTERS = 30_000;

const MANIFEST_NAMES = [
  "package.json",
  "composer.json",
  "pyproject.toml",
  "cargo.toml",
  "go.mod",
  "gemfile",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "mix.exs",
  "deno.json",
  "requirements.txt",
] as const;

const CHANGELOG_NAMES = [
  "changelog.md",
  "changes.md",
  "history.md",
  "changelog",
] as const;

const HIGH_SIGNAL_DIRECTORIES = new Set([
  "app",
  "apps",
  "api",
  "bin",
  "cmd",
  "components",
  "config",
  "docs",
  "examples",
  "lib",
  "packages",
  "routes",
  "scripts",
  "server",
  "src",
  "tests",
]);

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "vendor",
]);

export type EvidenceFile = {
  path: string;
  content: string;
  truncated: boolean;
};

export type RepositoryEvidence = {
  treeSha: string;
  paths: string[];
  truncated: boolean;
  manifest: EvidenceFile | null;
  changelog: EvidenceFile | null;
};

type EvidenceGitHubClient = {
  getTree(repository: GitHubRepo, ref: string): Promise<GitTree>;
  getFileContent(
    repository: GitHubRepo,
    path: string,
    ref?: string,
  ): Promise<string>;
};

type CollectRepositoryEvidenceOptions = {
  client: EvidenceGitHubClient;
  repository: GitHubRepo;
  ref: string;
  maxPaths?: number;
  maxFileCharacters?: number;
};

export async function collectRepositoryEvidence({
  client,
  repository,
  ref,
  maxPaths = DEFAULT_MAX_PATHS,
  maxFileCharacters = DEFAULT_MAX_FILE_CHARACTERS,
}: CollectRepositoryEvidenceOptions): Promise<RepositoryEvidence> {
  const pathLimit = clamp(maxPaths, 1, MAX_ALLOWED_PATHS);
  const fileCharacterLimit = Math.max(1, maxFileCharacters);
  const tree = await client.getTree(repository, ref);
  const manifestEntry = findRootFile(tree.entries, MANIFEST_NAMES);
  const changelogEntry = findRootFile(tree.entries, CHANGELOG_NAMES);
  const eligibleEntries = tree.entries
    .filter(isEligiblePath)
    .sort((left, right) => compareEntries(left, right, manifestEntry, changelogEntry));
  const uniquePaths = [...new Set(eligibleEntries.map((entry) => entry.path))];
  const paths = uniquePaths.slice(0, pathLimit);
  const omittedByDepth = tree.entries.some(
    (entry) => getPathDepth(entry.path) > 2,
  );

  const [manifest, changelog] = await Promise.all([
    loadEvidenceFile(
      client,
      repository,
      ref,
      manifestEntry,
      fileCharacterLimit,
    ),
    loadEvidenceFile(
      client,
      repository,
      ref,
      changelogEntry,
      fileCharacterLimit,
    ),
  ]);

  return {
    treeSha: tree.sha,
    paths,
    truncated:
      tree.truncated || omittedByDepth || uniquePaths.length > pathLimit,
    manifest,
    changelog,
  };
}

function findRootFile(
  entries: GitTreeEntry[],
  preferredNames: readonly string[],
) {
  const rootFiles = new Map(
    entries
      .filter((entry) => entry.type === "blob" && getPathDepth(entry.path) === 1)
      .map((entry) => [entry.path.toLowerCase(), entry]),
  );

  for (const name of preferredNames) {
    const match = rootFiles.get(name);

    if (match) {
      return match;
    }
  }

  return undefined;
}

function isEligiblePath(entry: GitTreeEntry) {
  if (entry.type !== "blob" && entry.type !== "tree") {
    return false;
  }

  const segments = entry.path.split("/");

  return (
    segments.length <= 2 &&
    !segments.some((segment) => IGNORED_DIRECTORIES.has(segment.toLowerCase()))
  );
}

function compareEntries(
  left: GitTreeEntry,
  right: GitTreeEntry,
  manifestEntry?: GitTreeEntry,
  changelogEntry?: GitTreeEntry,
) {
  const scoreDifference =
    getEntryScore(left, manifestEntry, changelogEntry) -
    getEntryScore(right, manifestEntry, changelogEntry);

  return scoreDifference || left.path.localeCompare(right.path);
}

function getEntryScore(
  entry: GitTreeEntry,
  manifestEntry?: GitTreeEntry,
  changelogEntry?: GitTreeEntry,
) {
  if (entry.path === manifestEntry?.path) {
    return 0;
  }

  if (entry.path === changelogEntry?.path) {
    return 1;
  }

  const segments = entry.path.split("/");
  const topLevelName = segments[0].toLowerCase();
  const isHighSignal = HIGH_SIGNAL_DIRECTORIES.has(topLevelName);

  if (segments.length === 1 && entry.type === "tree" && isHighSignal) {
    return 10;
  }

  if (segments.length === 2 && isHighSignal) {
    return 20;
  }

  if (segments.length === 1 && entry.type === "tree") {
    return 30;
  }

  if (segments.length === 1) {
    return 40;
  }

  return 50;
}

async function loadEvidenceFile(
  client: EvidenceGitHubClient,
  repository: GitHubRepo,
  ref: string,
  entry: GitTreeEntry | undefined,
  maxCharacters: number,
): Promise<EvidenceFile | null> {
  if (!entry) {
    return null;
  }

  const content = await client.getFileContent(repository, entry.path, ref);

  return {
    path: entry.path,
    content: content.slice(0, maxCharacters),
    truncated: content.length > maxCharacters,
  };
}

function getPathDepth(path: string) {
  return path.split("/").length;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(Math.floor(value), minimum), maximum);
}
