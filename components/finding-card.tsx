import type { Confidence, Finding } from "@/lib/agent/schema";

const confidenceStyles: Record<
  Confidence,
  { label: string; className: string }
> = {
  high: {
    label: "High confidence",
    className: "bg-danger-surface text-danger",
  },
  medium: {
    label: "Medium confidence",
    className: "bg-warning-surface text-primary-hover",
  },
  low: {
    label: "Low confidence",
    className: "bg-surface-strong text-accent",
  },
};

export function FindingCard({ finding }: { finding: Finding }) {
  const confidence = confidenceStyles[finding.confidence];

  return (
    <article className="border-border bg-canvas rounded-md border p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-muted font-mono text-[0.6875rem]">README section</p>
          <h4 className="text-ink mt-1 break-words text-base font-semibold text-pretty">
            {finding.section}
          </h4>
        </div>
        <span
          className={`${confidence.className} inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold`}
        >
          <ConfidenceIcon confidence={finding.confidence} />
          {confidence.label}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-muted text-xs font-medium">Issue</p>
        <p className="text-ink mt-1.5 break-words text-sm leading-6 text-pretty">
          {finding.issue}
        </p>
      </div>

      <div className="border-border bg-surface mt-4 rounded-md border p-4">
        <p className="text-muted flex items-center gap-1.5 font-mono text-[0.6875rem] font-medium">
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-3.5">
            <path
              d="M3 2.75h7l3 3v7.5H3v-10.5Z"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            <path
              d="M10 2.75v3h3M5.5 8.25h5m-5 2.5h5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
          Repository evidence
        </p>
        <p className="text-ink mt-2 break-words text-sm leading-6 text-pretty">
          {finding.evidence}
        </p>
      </div>
    </article>
  );
}

function ConfidenceIcon({ confidence }: { confidence: Confidence }) {
  if (confidence === "high") {
    return (
      <svg aria-hidden="true" viewBox="0 0 14 14" fill="none" className="size-3.5">
        <path
          d="M7 1.75 12.25 11H1.75L7 1.75Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path
          d="M7 5v2.75m0 1.5h.01"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (confidence === "medium") {
    return (
      <svg aria-hidden="true" viewBox="0 0 14 14" fill="none" className="size-3.5">
        <path
          d="m7 1.5 5.5 5.5L7 12.5 1.5 7 7 1.5Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path
          d="M7 4.5v3m0 2h.01"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 14 14" fill="none" className="size-3.5">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M7 6.25v3m0-5h.01"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
