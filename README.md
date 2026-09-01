# ReadmeCheck Agent

An AI agent that audits a public GitHub repository's README against the repository's own evidence — the manifest, changelog, and file tree — and flags sections that no longer match the code, with the supporting evidence for every finding.

**Live demo:** https://readme-check-agent.vercel.app

Built for the Vercel AI Gateway Hackathon. All model calls route through [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) — no direct provider SDK is used.

## What it does

1. You paste a public GitHub repository URL, e.g. `https://github.com/vercel/next.js`.
2. The server fetches the README, the default branch's file tree, the root manifest (`package.json` / `composer.json` / etc.), and the changelog when present.
3. The evidence is bounded — at most 20 repository paths, top-level plus one subfolder — so the model never receives the whole codebase.
4. The agent, a documentation auditor prompt running on MiniMax M3 via AI Gateway, compares README claims against that evidence.
5. The UI shows findings grouped by confidence, each with the section, the issue, and the repository evidence behind it.

The auditor is deliberately conservative. Claims that cannot be verified from the supplied evidence are not flagged, and a clean repository returns an honest empty result instead of invented findings.

## How it works

```text
Browser ── POST /api/analyze ──► Next.js Route Handler (server-only)
                                  │
                                  ├─► GitHub REST API (readme, tree, manifest, changelog)
                                  │      unauthenticated public data, 60 req/hr cap
                                  │
                                  ├─► Evidence collector
                                  │      caps paths at 20, marks truncated context
                                  │
                                  └─► AI SDK generateText → Vercel AI Gateway
                                         model: minimax/minimax-m3-free
                                         fallback: minimax/minimax-m2.7-free
                                         structured output (Zod schema)
                                  │
                                  ◄── findings: section / issue / evidence / confidence
```

Findings are validated against a strict Zod schema. A narrow repair path handles models that wrap JSON in Markdown fences, then re-validates before anything reaches the UI. Malformed output is retried once and fails safely otherwise.

## Project structure

```text
app/
  page.tsx                     main UI
  api/analyze/route.ts         server route: GitHub fetch + Gateway audit
lib/
  github/repo-url.ts           URL parsing and validation
  github/client.ts             GitHub REST client with typed errors
  github/evidence.ts           bounded evidence collector (path cap, truncation flags)
  agent/schema.ts              finding/response Zod schemas
  agent/prompt.ts              auditor system prompt + snapshot builder
  agent/audit.ts               AI Gateway call, retry, repair
  ai/gateway.ts                model IDs
components/                    form, loading, results, error, finding cards
services/analyze-service.ts    typed fetch client for /api/analyze
hooks/use-analyze-repository.ts React Query mutation hook
evaluations/                   opt-in live model evaluation suite
documents/                     PRD, roadmap, evaluation notes, deployment guide
```

## Local setup

Requirements: Node.js 20+ and an AI Gateway API key.

```bash
npm install
cp .env.example .env.local    # then set AI_GATEWAY_API_KEY
npm run dev                   # http://localhost:3000
```

Get the key from the AI Gateway API Keys page in your Vercel dashboard. Optionally set `GITHUB_TOKEN` to raise the GitHub API rate limit from 60 to 5,000 requests per hour.

### Quality checks

```bash
npm run check                 # lint + typecheck + test + build
npm run test                  # unit tests (mocked, no network)
RUN_GITHUB_INTEGRATION=1 npm test -- lib/github/client.integration.test.ts
RUN_AI_EVALUATION=1 npm test -- evaluations/agent.integration.test.ts   # spends Gateway quota
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AI_GATEWAY_API_KEY` | yes | Authenticates model calls through AI Gateway |
| `GITHUB_TOKEN` | no | Raises the GitHub API rate limit |

Server-side only. Nothing is exposed to the browser bundle.

## Limitations

- Public GitHub repositories only; private repos and other forges are out of scope.
- The free MiniMax models are rate-limited per model by AI Gateway; rapid repeated analyses can temporarily return HTTP 429, which the UI surfaces with a retry action.
- Evidence is intentionally bounded (20 paths). A partial listing is never treated as proof that an unlisted file is absent.
- The agent reports contradictions supported by evidence; it does not rewrite READMEs.

## License

MIT.
