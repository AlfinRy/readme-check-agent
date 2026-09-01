# Deployment

Production URL: https://readme-check-agent.vercel.app

## Platform

- Hosting: Vercel (team `alfinrys-projects`, project `readme-check-agent`)
- Framework preset: Next.js (App Router, Turbopack build)
- Region: Washington, D.C., USA (iad1) — Vercel default
- Runtime: Node.js serverless functions for `/api/analyze`

## Environment Variables

| Variable | Scope | Type | Purpose |
|---|---|---|---|
| `AI_GATEWAY_API_KEY` | Production, Preview | Secret | Authenticates all model calls through Vercel AI Gateway |
| `GITHUB_TOKEN` | not set | — | Optional; raises GitHub API rate limit from 60 req/hr when provided |

No variable uses the `NEXT_PUBLIC_` prefix, so no secret reaches the client bundle.

## Deployment Procedure

```bash
npm run check          # lint + typecheck + test + build
npx vercel deploy --prod
```

The `.vercel/` directory stays local (gitignored). Configuration is tracked by this document instead.

## Verified Smoke Test (1 September 2026)

| Check | Result |
|---|---|
| Homepage `GET /` | HTTP 200 |
| `POST /api/analyze` with `https://github.com/vercel/next.js` | HTTP 200, structured result |
| Model routed through AI Gateway | `minimax/minimax-m3-free` |
| Findings payload | Empty findings with partial-context note (valid conservative result) |

## Operational Notes

- `/api/analyze` sets `maxDuration = 60` and `Cache-Control: no-store`.
- Free-tier AI Gateway models are rate-limited per model. Repeated back-to-back analyses can return `AI_RATE_LIMITED` (HTTP 429). The UI surfaces this state with a retry action.
- Unauthenticated GitHub API calls are capped at 60 requests per hour per source IP.
- The MiniMax `-free` model IDs are a Vercel promotion through Sunday, 6 September 2026. After the promotion, switch `AUDIT_MODEL_ID` in `lib/ai/gateway.ts` to a standard model ID.
