import { AnalyzeApiError } from "@/services/analyze-service";

type AnalysisErrorProps = {
  error: Error;
  onRetry: () => void;
};

const errorTitles: Record<string, string> = {
  REPOSITORY_NOT_FOUND: "Repository not found",
  PRIVATE_REPOSITORY: "Private repository not supported",
  README_NOT_FOUND: "README not found",
  GITHUB_RATE_LIMITED: "GitHub rate limit reached",
  GITHUB_UNAVAILABLE: "GitHub is unavailable",
  NETWORK_ERROR: "Connection interrupted",
  ANALYSIS_FAILED: "Analysis could not finish",
};

export function AnalysisError({ error, onRetry }: AnalysisErrorProps) {
  const apiError = error instanceof AnalyzeApiError ? error : null;
  const title = apiError
    ? (errorTitles[apiError.code] ?? "Analysis could not finish")
    : "Analysis could not finish";
  const message = apiError
    ? apiError.message
    : "An unexpected error stopped the analysis. Try again shortly.";
  const retryTime = apiError?.retryAt
    ? formatRetryTime(apiError.retryAt)
    : null;

  return (
    <section
      className="border-danger/25 bg-danger-surface border px-5 py-5 sm:px-6"
      aria-labelledby="analysis-error-title"
      role="alert"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className="bg-canvas text-danger grid size-8 shrink-0 place-items-center rounded-full"
            aria-hidden="true"
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-4">
              <path
                d="M10 3.25 17 16H3l7-12.75Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M10 7.25v4m0 2.25h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div>
            <h2 id="analysis-error-title" className="text-sm font-semibold">
              {title}
            </h2>
            <p className="text-muted mt-1 max-w-[64ch] text-sm leading-6">
              {message}
            </p>
            {retryTime ? (
              <p className="text-muted mt-1 text-xs">
                Suggested retry time: {retryTime}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="border-border-strong bg-canvas text-ink hover:border-ink focus-visible:ring-primary/30 inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border px-3.5 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:outline-none"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5">
            <path
              d="M13 5.5V2.75l-1.1 1.1A5.25 5.25 0 1 0 13.2 9"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Retry analysis
        </button>
      </div>
    </section>
  );
}

function formatRetryTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
