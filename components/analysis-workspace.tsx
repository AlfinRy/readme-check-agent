"use client";

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
      <p className="sr-only" role="status" aria-live="polite">
        {analysis.isPending
          ? "Analyzing repository documentation."
          : analysis.isSuccess
            ? "Repository analysis complete."
            : ""}
      </p>
    </div>
  );
}
