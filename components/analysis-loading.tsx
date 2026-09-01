export function AnalysisLoading() {
  return (
    <section
      className="border-border bg-canvas border px-5 py-6 sm:px-6"
      aria-labelledby="analysis-loading-title"
      aria-busy="true"
    >
      <div className="flex items-start gap-3">
        <span
          className="bg-primary/12 text-primary mt-0.5 grid size-8 shrink-0 place-items-center rounded-full"
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-4">
            <path
              d="M10 3v3m0 8v3M3 10h3m8 0h3M5.05 5.05l2.12 2.12m5.66 5.66 2.12 2.12m0-9.9-2.12 2.12m-5.66 5.66-2.12 2.12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div>
          <h2 id="analysis-loading-title" className="text-sm font-semibold">
            Reading repository evidence
          </h2>
          <p className="text-muted mt-1 text-sm leading-6">
            Comparing README claims with the manifest, changelog, and bounded
            file tree. This can take a few seconds.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3" aria-hidden="true">
        <div className="bg-surface-strong h-2.5 w-2/5 animate-pulse rounded motion-reduce:animate-none" />
        <div className="bg-surface h-16 animate-pulse rounded-md motion-reduce:animate-none" />
        <div className="bg-surface h-16 animate-pulse rounded-md motion-reduce:animate-none" />
      </div>
    </section>
  );
}
