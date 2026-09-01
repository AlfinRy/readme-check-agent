# Agent Evaluation Notes

## Configuration

- Evaluation date: 1 September 2026
- Primary model: `minimax/minimax-m3-free`
- Fallback model: `minimax/minimax-m2.7-free`
- AI SDK reasoning setting: `medium`
- Path cap: 20
- Inputs: README, root manifest, optional changelog, and bounded repository paths

## Cases

| Case | Expected behavior | Observed behavior | Status |
|---|---|---|---|
| `fixtures/readme-in-sync` | Return no findings for matching Node.js and development instructions | Structured generation completed during the first evaluation sequence; full assertion rerun is pending after the free-tier rate window resets | Pending rerun |
| `fixtures/outdated-readme` | Detect the Node.js version and missing `npm start` script contradictions | Model identified both contradictions with high confidence and cited the manifest/changelog, but returned fenced JSON with `contradiction` instead of `issue` | Detected; output repair added |
| `vercel/next.js` | Complete a real public repository audit without invented evidence | Full `/api/analyze` smoke test completed successfully with an empty finding list and 20 bounded paths | Passed |

## Prompt and Parser Changes

The outdated fixture exposed inconsistent structured output from the free model. The model produced accurate evidence but wrapped JSON in a Markdown fence and used alternative keys. The following safeguards were added:

- The system prompt now requires raw JSON and the exact `section`, `issue`, `evidence`, and `confidence` fields.
- Schemas are strict and reject unknown fields.
- A narrow repair path strips JSON fences and maps only the known `contradiction` alias to `issue`, then validates the repaired value against the strict schema.
- Invalid structured output is retried once. Arbitrary text or an invalid schema still fails safely.

## Reasoning A/B

The planned low-versus-medium comparison could not be completed in the same session. AI Gateway began returning `429` responses after several free-model requests. Vercel documents lower per-model limits for free-tier requests, but does not publish the exact threshold.

The evaluation suite remains available through:

```bash
RUN_AI_EVALUATION=1 npm test -- evaluations/agent.integration.test.ts
```

Set `AI_GATEWAY_API_KEY` in the shell before running it. The integration suite spaces requests by 20 seconds to reduce the chance of another free-tier limit.

## Current Assessment

- Direct contradictions were grounded in supplied evidence rather than invented files.
- The popular repository smoke test demonstrated a valid empty result.
- Structured-output noncompliance is now handled conservatively and schema-validated.
- Medium reasoning remains the default until the low-effort rerun is completed.
- For a reliable demo, avoid repeated back-to-back analyses on the free model or move the Gateway team to paid credits before recording.
