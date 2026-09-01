import Link from "next/link";

import { AnalysisWorkspace } from "@/components/analysis-workspace";

export default function Home() {
  return (
    <div className="bg-canvas text-ink flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="bg-ink text-canvas focus:ring-primary sr-only z-50 rounded-md px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-3 focus:outline-none"
      >
        Skip to repository audit
      </a>
      <header className="border-border border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="focus-visible:ring-primary/30 inline-flex min-h-11 items-center gap-2.5 rounded-sm focus-visible:ring-3 focus-visible:outline-none"
          >
            <span
              className="bg-primary grid size-5 place-items-center rounded-[0.3rem] text-[0.625rem] font-bold text-white"
              aria-hidden="true"
            >
              R
            </span>
            <span className="font-mono text-sm font-semibold tracking-[-0.02em]">
              readme<span className="text-muted">/</span>check
            </span>
          </Link>
          <div className="text-muted flex items-center gap-2 text-xs">
            <span className="hidden sm:inline">Powered by</span>
            <span className="text-ink font-medium">Vercel AI Gateway</span>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16"
      >
        <div className="max-w-2xl">
          <div className="text-muted mb-5 flex items-center gap-2 font-mono text-xs">
            <span className="border-border bg-surface rounded border px-2 py-1">
              README auditor
            </span>
            <span aria-hidden="true">/</span>
            <span>public repositories</span>
          </div>
          <h1 className="text-ink text-balance text-4xl leading-[1.08] font-semibold tracking-[-0.035em] sm:text-5xl">
            Check the README against the repository.
          </h1>
          <p className="text-muted mt-5 max-w-[62ch] text-pretty text-base leading-7 sm:text-lg">
            Find documentation claims that no longer match the manifest, file
            structure, or changelog. Every finding includes the evidence used
            to flag it.
          </p>
        </div>

        <div className="mt-9 sm:mt-11">
          <AnalysisWorkspace />
        </div>

        <div className="text-muted mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.6875rem]">
          <span>README.md</span>
          <span>manifest</span>
          <span>changelog</span>
          <span>≤20 repository paths</span>
        </div>
      </main>

      <footer className="border-border mt-auto border-t">
        <div className="text-muted mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>ReadmeCheck Agent does not modify repository files.</p>
          <a
            href="https://github.com/AlfinRy/readme-check-agent"
            target="_blank"
            rel="noreferrer"
            className="text-ink focus-visible:ring-primary/30 inline-flex min-h-11 w-fit items-center rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:outline-none"
          >
            View source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
