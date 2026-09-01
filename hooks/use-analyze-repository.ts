"use client";

import { useMutation } from "@tanstack/react-query";

import { analyzeRepository } from "@/services/analyze-service";

export function useAnalyzeRepository() {
  return useMutation({
    mutationKey: ["repository-analysis"],
    mutationFn: analyzeRepository,
    retry: false,
  });
}
