# Product

## Register

product

## Users

ReadmeCheck Agent is for developers, maintainers, and technical contributors who need to verify whether a public repository's README still reflects its codebase. They arrive with a concrete audit task and want evidence they can evaluate quickly, not an exploratory or entertainment-oriented experience.

## Product Purpose

ReadmeCheck Agent compares claims in a public GitHub repository's README with bounded, high-signal evidence from the repository. It identifies likely contradictions, names the affected section, explains the evidence, and communicates confidence without inventing issues. Success means a developer can paste a repository URL and reach a credible, actionable result with minimal effort.

## Brand Personality

Precise, trustworthy, and calm. The product should feel like a focused developer audit tool: factual, conservative, and clear under uncertainty.

## Anti-references

Avoid marketing-heavy landing pages, oversized gradients, hero illustrations, playful consumer-product patterns, and decorative effects that compete with audit results. Avoid interfaces that make model output appear more certain than its evidence supports. Do not add visual complexity merely to make the hackathon project look larger than it is.

Positive references are Linear's disciplined hierarchy, GitHub's clean developer-tool and monospace details, and the Vercel dashboard's restrained ecosystem fit.

## Design Principles

1. **Evidence before assertion.** Every finding should make its supporting repository evidence easy to inspect.
2. **Confidence must be legible.** Communicate uncertainty with text, iconography, and color together rather than color alone.
3. **The audit is the primary task.** Keep URL entry, progress, findings, and recovery paths direct; secondary explanation must not obstruct the workflow.
4. **Conservative output earns trust.** A clear empty result is better than a weak or fabricated finding.
5. **Familiar developer-tool patterns reduce friction.** Prefer standard controls, restrained typography, and predictable interaction over novelty.

## Accessibility & Inclusion

Prioritize pragmatic accessibility within the hackathon scope rather than claiming formal WCAG 2.2 AA certification. Maintain readable text and background contrast, support keyboard navigation for the primary form and result actions, provide visible focus states, and never communicate status through motion or color alone. Keep motion minimal and respect reduced-motion preferences. Formal screen-reader and full compliance testing are outside the MVP scope, but semantic HTML and accessible labels remain required implementation practices.
