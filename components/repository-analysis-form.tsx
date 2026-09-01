"use client";

import { FormEvent, useId, useState } from "react";

import {
  parseGitHubRepoUrl,
  RepoUrlValidationError,
} from "@/lib/github/repo-url";

const EXAMPLE_REPOSITORY = "https://github.com/vercel/next.js";

type RepositoryAnalysisFormProps = {
  isPending: boolean;
  onAnalyze: (repoUrl: string) => void;
};

export function RepositoryAnalysisForm({
  isPending,
  onAnalyze,
}: RepositoryAnalysisFormProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    try {
      parseGitHubRepoUrl(repoUrl);
      setFieldError(null);
      onAnalyze(repoUrl.trim());
    } catch (error) {
      setFieldError(
        error instanceof RepoUrlValidationError
          ? error.message
          : "Enter a valid public GitHub repository URL.",
      );
    }
  }

  return (
    <section
      className="border-border bg-canvas border shadow-[0_18px_55px_oklch(0.17_0.006_45/0.07)]"
      aria-labelledby="analysis-form-title"
    >
      <div className="border-border flex items-center justify-between border-b px-5 py-4 sm:px-6">
        <div>
          <h2 id="analysis-form-title" className="text-sm font-semibold">
            Repository audit
          </h2>
          <p className="text-muted mt-0.5 text-xs">
            Public GitHub repositories only
          </p>
        </div>
        <span className="bg-surface-strong text-muted inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.6875rem] font-medium">
          <span
            className="bg-success size-1.5 rounded-full"
            aria-hidden="true"
          />
          API ready
        </span>
      </div>

      <form className="p-5 sm:p-6" onSubmit={handleSubmit} noValidate>
        <label
          className="text-ink block text-sm font-medium"
          htmlFor={inputId}
        >
          GitHub repository URL
        </label>
        <div className="mt-2.5 flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
              >
                <path
                  d="M9.5 14.5 14.5 9m-6.75 2.25-1.5 1.5a3.536 3.536 0 0 0 5 5l1.5-1.5m-1.5-8.5 1.5-1.5a3.536 3.536 0 0 1 5 5l-1.5 1.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
              <input
                id={inputId}
                name="repoUrl"
                type="url"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                spellCheck={false}
                value={repoUrl}
                onChange={(event) => {
                  setRepoUrl(event.target.value);
                  if (fieldError) setFieldError(null);
                }}
                placeholder="https://github.com/owner/repository"
                disabled={isPending}
                aria-invalid={Boolean(fieldError)}
                aria-describedby={fieldError ? `${hintId} ${errorId}` : hintId}
                className="border-border-strong text-ink placeholder:text-placeholder focus:border-primary focus:ring-primary/20 h-11 w-full rounded-md border bg-transparent pr-3 pl-10 font-mono text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:ring-3 disabled:cursor-wait disabled:opacity-65"
              />
            </div>
            <p id={hintId} className="text-muted mt-2 text-xs leading-5">
              Use the repository root, not a branch, issue, or file URL.
            </p>
            {fieldError ? (
              <p
                id={errorId}
                className="text-danger mt-2 flex items-start gap-1.5 text-xs font-medium"
                role="alert"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="mt-0.5 size-3.5 shrink-0"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 4.75v3.5m0 2.5h.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                {fieldError}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-ink text-canvas hover:bg-primary focus-visible:ring-primary/30 inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-[background-color,box-shadow,transform] duration-150 hover:-translate-y-px focus-visible:ring-3 focus-visible:outline-none active:translate-y-0 disabled:pointer-events-none disabled:opacity-55 sm:min-w-42"
          >
            {isPending ? (
              <>
                <span
                  className="border-canvas/35 border-t-canvas size-3.5 animate-spin rounded-full border-2 motion-reduce:animate-none"
                  aria-hidden="true"
                />
                Analyzing…
              </>
            ) : (
              <>
                Analyze README
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="size-4"
                >
                  <path
                    d="M3 8h9m-3.5-3.5L12 8l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>
        </div>

        <div className="border-border mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setRepoUrl(EXAMPLE_REPOSITORY);
              setFieldError(null);
            }}
            disabled={isPending}
            className="text-accent focus-visible:ring-accent/25 inline-flex min-h-11 items-center rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:outline-none disabled:opacity-55"
          >
            Use example repository
          </button>
          <span className="text-muted inline-flex items-center gap-1.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              className="size-3.5"
            >
              <path
                d="M8 1.75 13 3.5v3.75c0 3.1-2.05 5.75-5 7-2.95-1.25-5-3.9-5-7V3.5l5-1.75Z"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              <path
                d="m5.75 8 1.5 1.5 3-3"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Evidence is processed server-side
          </span>
        </div>
      </form>
    </section>
  );
}
