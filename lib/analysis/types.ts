import type { AuditResponse } from "@/lib/agent/schema";

export type AnalyzeSuccessResponse = {
  repository: {
    owner: string;
    name: string;
    fullName: string;
    htmlUrl: string;
    defaultBranch: string;
  };
  analysis: AuditResponse;
  context: {
    partial: boolean;
    pathsAnalyzed: number;
    manifestPath: string | null;
    changelogPath: string | null;
  };
  model: string;
};

export type AnalyzeErrorResponse = {
  error: {
    code: string;
    message: string;
    retryAt?: string;
  };
};
