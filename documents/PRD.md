# PRD: ReadmeCheck Agent
### AI Gateway Hackathon (Vercel) — Submission PRD

---

## 1. Overview

**Project name:** ReadmeCheck Agent *(working title — bebas diganti)*

**One-liner:** An AI agent that takes a public GitHub repo URL, compares the README against the actual codebase, and flags sections that are likely outdated — with a short explanation of why.

**Hackathon:** Vercel AI Gateway Hackathon
**Deadline:** 5 days from kickoff
**Submission format:** Public GitHub repo + demo video/link, posted as a reply to the announcement thread on X

**Origin:** Adapted from the earlier `readme-sync` PRD (Kiro "Ready, Spec, Ship" hackathon concept), re-scoped as a hosted AI agent instead of a CLI tool to fit this hackathon's format.

---

## 2. Problem Statement

Developers update code but forget to update the README. Over time, install instructions, API examples, feature lists, and architecture diagrams drift out of sync with reality — wasting time for new contributors and users who trust the README at face value.

---

## 3. Goal

Build the smallest possible working agent that proves the core value: **paste a repo link → get a list of README sections that no longer match the code, with reasoning.**

This is a hackathon MVP, not a production tool. Optimize for: working demo > feature completeness > polish.

---

## 4. Hackathon Compliance Requirements (non-negotiable)

- [ ] Agent takes a task, reasons, and returns output (satisfies the hackathon's definition of "agent")
- [ ] All LLM calls routed through **Vercel AI Gateway** (not directly to a provider SDK)
- [ ] Deployed on **Vercel**
- [ ] Repository is **public** (open source requirement)
- [ ] Submission includes: repo link + (demo video OR working hosted link)

---

## 5. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Required ecosystem for Vercel AI Gateway / AI SDK |
| AI routing | Vercel AI SDK + AI Gateway | `ai` npm package, gateway provider config |
| Model | **MiniMax M3 Free** via `minimax/minimax-m3-free` | Available through AI Gateway's free tier with a 1M-token context window. Use `minimax/minimax-m2.7-free` as the fallback model if the primary model is unavailable. |
| Data source | GitHub REST API (unauthenticated, public repos only) | No GitHub App/OAuth needed for MVP |
| Hosting | Vercel | Free tier is enough |
| Styling | Tailwind (minimal) | Function over form |

---

## 6. User Flow

1. User lands on a single-page app
2. User pastes a public GitHub repo URL (e.g. `https://github.com/owner/repo`)
3. User clicks "Analyze"
4. App shows a loading state
5. Agent returns a structured list: **README section → issue found → why it's likely outdated**
6. (Optional stretch) User can click "copy suggested fix" per section

---

## 7. Functional Requirements

### 7.1 Input handling
- Accept a GitHub repo URL, parse `owner/repo` from it
- Validate format before making any calls; show inline error if malformed

### 7.2 Data fetching (GitHub API)
- Fetch `README.md` (or closest match) via `GET /repos/{owner}/{repo}/readme`
- Fetch repo file tree via `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`
- From the tree, select a small, high-signal subset to send to the model — do **not** send the whole codebase:
  - `package.json` / `composer.json` / equivalent manifest (tells you real dependencies, scripts, entry points)
  - Top-level source folder listing (names only, not full contents) to check "features" claims
  - Any `CHANGELOG.md` if present
- Rate limit awareness: unauthenticated GitHub API is capped at 60 req/hr — fine for a demo, mention as a known limitation

### 7.3 Agent logic (core value)
- System prompt instructs the model to act as a documentation auditor
- Input to the model: README content + manifest file content + file/folder listing
- Model output must be **structured** (use AI SDK's structured output / tool-call mode, not free-form text) with this shape per finding:
  ```
  {
    section: string,       // which README heading/section
    issue: string,         // what's wrong
    evidence: string,       // what in the code contradicts it
    confidence: "low" | "medium" | "high"
  }
  ```
- If no issues found, return an empty findings array with a friendly "looks in sync" message — don't force fake findings

### 7.4 Output UI
- List of finding cards, grouped by confidence
- Each card: section name, issue, evidence, confidence badge
- Empty state: "No outdated sections detected"
- Error state: repo not found / private / rate-limited — show clear message, don't crash

### 7.5 AI Gateway integration
- All model calls go through Gateway's provider interface (not a direct OpenAI/Anthropic SDK call)
- API key stored as a Vercel environment variable, never exposed client-side
- Model calls happen in a server-side API route (`/app/api/analyze/route.ts`), not client-side

---

## 8. Out of Scope (explicitly cut for MVP)

- Private repo support / GitHub OAuth
- Multi-branch or PR-based analysis
- Auto-fixing README content
- Scheduling / webhook-based re-checks (this was in the original readme-sync PRD — cut it)
- User accounts, history, saved reports
- Support for non-GitHub sources (GitLab, Bitbucket)
- Analyzing full source code line-by-line (too slow/expensive for a demo)

---

## 9. Success Criteria (for the hackathon submission)

- Works end-to-end on at least 2-3 real public repos (test with your own repos, e.g. RegulationGuard or Mathesis, plus one popular OSS repo)
- Deployed and reachable via a public Vercel URL
- Demo video clearly shows: paste URL → real output, in under 90 seconds
- Repo is public with a clear README explaining what it does and that it uses AI Gateway

---

## 10. Suggested Build Timeline (5 days)

| Day | Focus |
|---|---|
| Day 1 | Next.js scaffold, Vercel AI Gateway key + connection test (simple prompt → response, confirm routing works) |
| Day 2 | GitHub API integration: fetch README + manifest + tree, parse into clean input for the model |
| Day 3 | Core agent prompt + structured output; test against 3-5 real repos, iterate on prompt quality |
| Day 4 | UI: input form, loading state, findings display, error states |
| Day 5 | Deploy, polish demo repo README, record demo video, submit via X reply |

---

## 11. Prompt Design Notes (for Claude Code to iterate on)

Starting system prompt direction:

> You are a documentation auditor. You are given a README and evidence about a codebase's actual structure and dependencies. Identify only claims in the README that are contradicted or unsupported by the evidence provided. Do not flag stylistic issues, missing sections, or things you can't verify from the evidence given. Be conservative — under-flagging is better than false positives.

This conservatism instruction matters for demo quality: a tool that hallucinates fake issues on a clean repo looks worse than one that correctly says "looks fine."

Reasoning support for MiniMax M3 Free must be verified through AI Gateway during Day 3 testing. If supported, start with **medium** reasoning effort; otherwise rely on the conservative prompt and bounded evidence rather than provider-specific options.

---

## 12. Locked Decisions

- **Framework:** Next.js (App Router) — confirmed, no PHP/Laravel path since Vercel doesn't natively support PHP runtimes
- **Model:** `minimax/minimax-m3-free` via AI Gateway, with `minimax/minimax-m2.7-free` as fallback — both are available through the Gateway free tier
- **File tree cap:** For repos with a deep/large tree, only send top-level directories + 1 level of subfolders, plus the manifest file (`package.json`/`composer.json`/etc). Hard cap at **~15-20 file paths** sent to the model. If the tree exceeds this, truncate and note in the prompt that the listing is partial — don't silently drop context.

---

## 13. File Structure (suggested starting point)

```
/app
  /api/analyze/route.ts     — server route: fetch GitHub data + call Gateway
  /page.tsx                 — main UI
/lib
  github.ts                 — GitHub API fetch helpers
  agent.ts                  — prompt + structured output schema
/components
  RepoForm.tsx
  FindingsList.tsx
  FindingCard.tsx
```