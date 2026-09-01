# Design System

## Direction

A maintainer is checking repository claims at a well-lit desk and needs the interface to recede behind the evidence. The visual strategy is restrained: pure white canvas, near-black typography, cool neutral structure, and a small burnt-orange brand signal anchored by the generated seed hue.

## Theme

- Register: product
- Default theme: light
- Color strategy: restrained
- References: Linear hierarchy, GitHub developer-tool conventions, Vercel dashboard restraint
- Motion: state communication only, 150–200ms, with reduced-motion support

## Color Tokens

All implementation colors use OKLCH.

```css
--canvas: oklch(1 0 0);
--surface: oklch(0.975 0 0);
--surface-strong: oklch(0.945 0 0);
--ink: oklch(0.17 0.006 45);
--muted: oklch(0.46 0.012 45);
--border: oklch(0.88 0.006 45);
--border-strong: oklch(0.74 0.012 45);
--primary: oklch(0.55 0.175 45);
--primary-hover: oklch(0.49 0.17 45);
--accent: oklch(0.42 0.13 250);
--success: oklch(0.42 0.115 150);
--danger: oklch(0.48 0.17 28);
--warning-surface: oklch(0.95 0.035 75);
--success-surface: oklch(0.95 0.03 150);
--danger-surface: oklch(0.95 0.035 28);
```

The primary orange is a brand/focus signal and may represent medium confidence. High and low confidence must use distinct text and icons, not color alone.

## Typography

- UI and body: Geist Sans
- Repository paths, evidence labels, and technical metadata: Geist Mono
- Product headings use the same sans family with weight and size contrast, not a display face.
- Body copy should stay within 70 characters per line when possible.

## Layout

- Main content width: approximately 960px
- Primary workflow remains in one vertical reading path: context, repository form, progress, result summary, findings
- Use one task surface where containment improves comprehension. Avoid nested card layouts.
- Mobile structure stacks controls and keeps all primary actions full-width where appropriate.

## Components

### Header

Compact product identity and an ecosystem note. It should orient rather than market.

### Repository form

Visible URL label, monospace input, concise helper text, inline validation, and one primary action. Support Enter submission and prevent duplicate requests while pending.

### Findings

Order by high, medium, then low confidence. Each result presents section, issue, evidence, and a confidence label with icon and text. Evidence is visually distinct and uses monospace only for paths or code fragments.

### States

- Loading: stable skeleton/progress copy, no decorative spinner dependency
- Empty: confirm what evidence was checked and avoid overstating certainty
- Error: name the recoverable problem and provide a retry action
- Focus: visible orange outline with sufficient offset

## Accessibility

- Use semantic landmarks, labels, headings, lists, and status regions.
- Keep keyboard interaction native.
- Do not rely on color or animation alone.
- Respect `prefers-reduced-motion`.
- Maintain readable text contrast and visible focus states without claiming formal certification.
