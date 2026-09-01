import { FindingCard } from "@/components/finding-card";
import type { AnalyzeSuccessResponse } from "@/lib/analysis/types";
import type { Confidence, Finding } from "@/lib/agent/schema";

const confidenceOrder: Confidence[] = ["high", "medium", "low"];
const groupTitles: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function AnalysisResults({ result }: { result: AnalyzeSuccessResponse }) {
  const findings = result.analysis.findings;

  return (
    <section className="space-y-5" aria-labelledby="analysis-results-title">
      <div className="border-border bg-canvas border">
        <div className="border-border flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-muted font-mono text-[0.6875rem]">
              Analysis complete
            </p>
            <h2
              id="analysis-results-title"
              className="text-ink mt-1 text-xl font-semibold tracking-[-0.02em]"
            >
              {findings.length === 0
                ? "No outdated sections detected"
                : `${findings.length} likely outdated ${findings.length === 1 ? "section" : "sections"}`}
            </h2>
            <a
              href={result.repository.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="text-accent focus-visible:ring-accent/25 mt-1 inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-sm font-mono text-xs font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:outline-none"
            >
              <span className="truncate">{result.repository.fullName}</span>
              <svg aria-hidden="true" viewBox="0 0 14 14" fill="none" className="size-3 shrink-0">
                <path
                  d="M5.25 2.75h6v6m0-6-7.5 7.5"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
          <span className="bg-success-surface text-success inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
            <svg aria-hidden="true" viewBox="0 0 14 14" fill="none" className="size-3.5">
              <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.25" />
              <path
                d="m4.5 7 1.6 1.6 3.4-3.4"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Audit finished
          </span>
        </div>

        <dl className="divide-border grid divide-y text-xs sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <ContextItem label="Default branch" value={result.repository.defaultBranch} />
          <ContextItem label="Paths checked" value={String(result.context.pathsAnalyzed)} />
          <ContextItem label="Manifest" value={result.context.manifestPath ?? "Not found"} />
          <ContextItem label="Model" value={shortModelName(result.model)} />
        </dl>
      </div>

      {findings.length === 0 ? (
        <EmptyAnalysis result={result} />
      ) : (
        <FindingsByConfidence findings={findings} />
      )}
    </section>
  );
}

function FindingsByConfidence({ findings }: { findings: Finding[] }) {
  return (
    <div className="space-y-7">
      {confidenceOrder.map((confidence) => {
        const group = findings.filter(
          (finding) => finding.confidence === confidence,
        );

        if (group.length === 0) {
          return null;
        }

        return (
          <section key={confidence} aria-labelledby={`${confidence}-findings`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 id={`${confidence}-findings`} className="text-sm font-semibold">
                {groupTitles[confidence]}
              </h3>
              <span className="text-muted font-mono text-xs">
                {group.length} {group.length === 1 ? "finding" : "findings"}
              </span>
            </div>
            <div className="space-y-3">
              {group.map((finding, index) => (
                <FindingCard
                  key={`${confidence}-${finding.section}-${index}`}
                  finding={finding}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EmptyAnalysis({ result }: { result: AnalyzeSuccessResponse }) {
  return (
    <div className="border-success/25 bg-success-surface border px-5 py-6 sm:px-6">
      <div className="flex items-start gap-3">
        <span
          className="bg-canvas text-success grid size-9 shrink-0 place-items-center rounded-full"
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-5">
            <path
              d="m5.25 10 3 3 6.5-6.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <h3 className="text-sm font-semibold">The supplied evidence looks in sync</h3>
          <p className="text-muted mt-1 max-w-[66ch] text-sm leading-6">
            The auditor found no supported contradictions between the README
            and the repository evidence it inspected.
            {result.context.partial
              ? " The repository listing was intentionally bounded, so this is not a guarantee that every claim is current."
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-5 py-3.5 sm:px-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink mt-1 truncate font-mono font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

function shortModelName(model: string) {
  return model.split("/").at(-1) ?? model;
}
