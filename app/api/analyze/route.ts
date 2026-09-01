import { RetryError } from "ai";
import { z } from "zod";

import { auditRepository } from "@/lib/agent/audit";
import { AUDIT_MODEL_ID } from "@/lib/ai/gateway";
import {
  createGitHubClient,
  GitHubClientError,
} from "@/lib/github/client";
import { collectRepositoryEvidence } from "@/lib/github/evidence";
import {
  parseGitHubRepoUrl,
  RepoUrlValidationError,
} from "@/lib/github/repo-url";

export const maxDuration = 60;

const MAX_REQUEST_BYTES = 2_048;
const MAX_README_CHARACTERS = 80_000;

const analyzeRequestSchema = z
  .object({
    repoUrl: z.string().trim().min(1).max(500),
  })
  .strict();

export async function POST(request: Request) {
  const parsedRequest = await parseAnalyzeRequest(request);

  if (parsedRequest instanceof Response) {
    return parsedRequest;
  }

  try {
    const repository = parseGitHubRepoUrl(parsedRequest.repoUrl);
    const client = createGitHubClient();
    const metadata = await client.getRepository(repository);
    const [readmeContent, evidence] = await Promise.all([
      client.getReadme(repository, metadata.defaultBranch),
      collectRepositoryEvidence({
        client,
        repository,
        ref: metadata.defaultBranch,
      }),
    ]);
    const readmeTruncated = readmeContent.length > MAX_README_CHARACTERS;
    const readme = readmeContent.slice(0, MAX_README_CHARACTERS);
    const analysis = await auditRepository({
      repository: {
        fullName: metadata.fullName,
        defaultBranch: metadata.defaultBranch,
      },
      readme,
      readmeTruncated,
      evidence,
    });

    return jsonResponse({
      repository: metadata,
      analysis,
      context: {
        partial:
          readmeTruncated ||
          evidence.truncated ||
          Boolean(evidence.manifest?.truncated) ||
          Boolean(evidence.changelog?.truncated),
        pathsAnalyzed: evidence.paths.length,
        manifestPath: evidence.manifest?.path ?? null,
        changelogPath: evidence.changelog?.path ?? null,
      },
      model: AUDIT_MODEL_ID,
    });
  } catch (error) {
    return handleAnalyzeError(error);
  }
}

async function parseAnalyzeRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.startsWith("application/json")) {
    return errorResponse(
      "UNSUPPORTED_MEDIA_TYPE",
      "Send the request as application/json.",
      415,
    );
  }

  const contentLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse(
      "REQUEST_TOO_LARGE",
      "The analysis request is too large.",
      413,
    );
  }

  let bodyText: string;

  try {
    bodyText = await request.text();
  } catch {
    return errorResponse("INVALID_REQUEST", "The request body is invalid.", 400);
  }

  if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
    return errorResponse(
      "REQUEST_TOO_LARGE",
      "The analysis request is too large.",
      413,
    );
  }

  let body: unknown;

  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse("INVALID_REQUEST", "The request body must be valid JSON.", 400);
  }

  const parsed = analyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      "INVALID_REQUEST",
      "Provide one public GitHub repository URL.",
      400,
    );
  }

  return parsed.data;
}

function handleAnalyzeError(error: unknown) {
  if (error instanceof RepoUrlValidationError) {
    return errorResponse("INVALID_REPOSITORY_URL", error.message, 400);
  }

  if (error instanceof GitHubClientError) {
    switch (error.code) {
      case "REPOSITORY_NOT_FOUND":
        return errorResponse(error.code, error.message, 404);
      case "PRIVATE_REPOSITORY":
      case "README_NOT_FOUND":
        return errorResponse(error.code, error.message, 422);
      case "RATE_LIMITED":
        return errorResponse(
          "GITHUB_RATE_LIMITED",
          error.message,
          429,
          error.retryAt ? { retryAt: error.retryAt.toISOString() } : undefined,
        );
      case "INVALID_RESPONSE":
      case "GITHUB_UNAVAILABLE":
        return errorResponse("GITHUB_UNAVAILABLE", error.message, 502);
    }
  }

  if (isAiRateLimited(error)) {
    return errorResponse(
      "AI_RATE_LIMITED",
      "The AI auditor is temporarily rate-limited. Wait a moment and try again.",
      429,
    );
  }

  console.error("Repository analysis failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });

  return errorResponse(
    "ANALYSIS_FAILED",
    "The repository could not be analyzed. Try again shortly.",
    502,
  );
}

function isAiRateLimited(error: unknown) {
  const candidate = RetryError.isInstance(error) ? error.lastError : error;

  return (
    typeof candidate === "object" &&
    candidate !== null &&
    (("name" in candidate && candidate.name === "GatewayRateLimitError") ||
      ("statusCode" in candidate && candidate.statusCode === 429))
  );
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string>,
) {
  return jsonResponse(
    { error: { code, message, ...details } },
    { status },
  );
}

function jsonResponse(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");

  return Response.json(data, { ...init, headers });
}
