import type {
  AnalyzeErrorResponse,
  AnalyzeSuccessResponse,
} from "@/lib/analysis/types";

export class AnalyzeApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly retryAt?: string,
  ) {
    super(message);
    this.name = "AnalyzeApiError";
  }
}

export async function analyzeRepository(repoUrl: string) {
  let response: Response;

  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
      cache: "no-store",
    });
  } catch {
    throw new AnalyzeApiError(
      "NETWORK_ERROR",
      "The analysis service could not be reached. Check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    const payload = await readErrorResponse(response);
    throw new AnalyzeApiError(
      payload.error.code,
      payload.error.message,
      response.status,
      payload.error.retryAt,
    );
  }

  return (await response.json()) as AnalyzeSuccessResponse;
}

async function readErrorResponse(response: Response): Promise<AnalyzeErrorResponse> {
  try {
    const payload = (await response.json()) as Partial<AnalyzeErrorResponse>;

    if (payload.error?.code && payload.error.message) {
      return payload as AnalyzeErrorResponse;
    }
  } catch {
    // Use the safe fallback below when the server response is not JSON.
  }

  return {
    error: {
      code: "UNEXPECTED_RESPONSE",
      message: "The analysis service returned an unexpected response.",
    },
  };
}
