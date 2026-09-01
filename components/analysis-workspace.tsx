"use client";

import { AnalysisError } from "@/components/analysis-error";
import { AnalysisLoading } from "@/components/analysis-loading";
import { AnalysisResults } from "@/components/analysis-results";
import { RepositoryAnalysisForm } from "@/components/repository-analysis-form";
import { useAnalyzeRepository } from "@/hooks/use-analyze-repository";

export function AnalysisWorkspace() {
  const analysis = useAnalyzeRepository();

  return (
    <div className="space-y-5">
      <RepositoryAnalysisForm
        isPending={analysis.isPending}
        onAnalyze={(repoUrl) => analysis.mutate(repoUrl)}
      />
      <div aria-live="polite">
        {analysis.isPending ? <AnalysisLoading /> : null}
        {analysis.isError ? (
          <AnalysisError
            error={analysis.error}
            onRetry={() => {
              if (analysis.variables) analysis.mutate(analysis.variables);
            }}
          />
        ) : null}
        {analysis.isSuccess ? <AnalysisResults result={analysis.data} /> : null}
      </div>
      <p className="sr-only" role="status">
        {analysis.isPending
          ? "Analyzing repository documentation."
          : analysis.isSuccess
            ? "Repository analysis complete."
            : ""}
      </p>
    </div>
  );
}
