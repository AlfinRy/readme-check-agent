import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { GitTree, GitTreeEntry } from "./client";
import { collectRepositoryEvidence } from "./evidence";

const repository = { owner: "owner", repo: "repo" };

describe("collectRepositoryEvidence", () => {
  it("collects prioritized paths, a manifest, and a changelog", async () => {
    const client = createClient(
      createTree([
        entry("README.md"),
        entry("src", "tree"),
        entry("src/index.ts"),
        entry("docs", "tree"),
        entry("docs/guide.md"),
        entry("package.json"),
        entry("CHANGELOG.md"),
      ]),
      {
        "package.json": '{"name":"demo"}',
        "CHANGELOG.md": "# Changes",
      },
    );

    const evidence = await collectRepositoryEvidence({
      client,
      repository,
      ref: "main",
    });

    expect(evidence).toEqual({
      treeSha: "root-tree-sha",
      paths: [
        "package.json",
        "CHANGELOG.md",
        "docs",
        "src",
        "docs/guide.md",
        "src/index.ts",
        "README.md",
      ],
      truncated: false,
      manifest: {
        path: "package.json",
        content: '{"name":"demo"}',
        truncated: false,
      },
      changelog: {
        path: "CHANGELOG.md",
        content: "# Changes",
        truncated: false,
      },
    });
    expect(client.getFileContent).toHaveBeenCalledTimes(2);
    expect(client.getFileContent).toHaveBeenCalledWith(
      repository,
      "package.json",
      "main",
    );
    expect(client.getFileContent).toHaveBeenCalledWith(
      repository,
      "CHANGELOG.md",
      "main",
    );
  });

  it("caps the listing at 20 paths and always keeps the manifest first", async () => {
    const manyEntries = [
      ...Array.from({ length: 30 }, (_, index) =>
        entry(`folder-${String(index).padStart(2, "0")}`, "tree"),
      ),
      entry("composer.json"),
    ];
    const client = createClient(createTree(manyEntries), {
      "composer.json": "{}",
    });

    const evidence = await collectRepositoryEvidence({
      client,
      repository,
      ref: "main",
      maxPaths: 100,
    });

    expect(evidence.paths).toHaveLength(20);
    expect(evidence.paths[0]).toBe("composer.json");
    expect(evidence.truncated).toBe(true);
  });

  it("marks the listing partial when GitHub truncates it or deep paths are omitted", async () => {
    const apiTruncatedClient = createClient(
      createTree([entry("src", "tree")], true),
    );
    const deepTreeClient = createClient(
      createTree([
        entry("src", "tree"),
        entry("src/features", "tree"),
        entry("src/features/audit.ts"),
      ]),
    );

    const [apiTruncated, depthTruncated] = await Promise.all([
      collectRepositoryEvidence({
        client: apiTruncatedClient,
        repository,
        ref: "main",
      }),
      collectRepositoryEvidence({
        client: deepTreeClient,
        repository,
        ref: "main",
      }),
    ]);

    expect(apiTruncated.truncated).toBe(true);
    expect(depthTruncated.truncated).toBe(true);
    expect(depthTruncated.paths).not.toContain("src/features/audit.ts");
  });

  it("returns null evidence files when no supported manifest or changelog exists", async () => {
    const client = createClient(
      createTree([entry("src", "tree"), entry("src/index.ts")]),
    );

    const evidence = await collectRepositoryEvidence({
      client,
      repository,
      ref: "main",
    });

    expect(evidence.manifest).toBeNull();
    expect(evidence.changelog).toBeNull();
    expect(client.getFileContent).not.toHaveBeenCalled();
  });

  it("truncates oversized evidence file content", async () => {
    const client = createClient(createTree([entry("pyproject.toml")]), {
      "pyproject.toml": "abcdefghij",
    });

    const evidence = await collectRepositoryEvidence({
      client,
      repository,
      ref: "main",
      maxFileCharacters: 5,
    });

    expect(evidence.manifest).toEqual({
      path: "pyproject.toml",
      content: "abcde",
      truncated: true,
    });
  });

  it("ignores generated dependency and build directories", async () => {
    const client = createClient(
      createTree([
        entry("node_modules", "tree"),
        entry("node_modules/pkg", "tree"),
        entry("dist", "tree"),
        entry("dist/index.js"),
        entry("src", "tree"),
      ]),
    );

    const evidence = await collectRepositoryEvidence({
      client,
      repository,
      ref: "main",
    });

    expect(evidence.paths).toEqual(["src"]);
  });
});

function createClient(tree: GitTree, contents: Record<string, string> = {}) {
  return {
    getTree: vi.fn().mockResolvedValue(tree),
    getFileContent: vi.fn(
      async (_repository: typeof repository, path: string) =>
        contents[path] ?? "",
    ),
  };
}

function createTree(entries: GitTreeEntry[], truncated = false): GitTree {
  return { sha: "root-tree-sha", truncated, entries };
}

function entry(path: string, type: GitTreeEntry["type"] = "blob"): GitTreeEntry {
  return { path, type, sha: `${path}-sha` };
}
