

# Implementation Plan: Modo Prompt + Modo SaaS Builder + UX/UI Light/Dark

This plan covers three interconnected features built on top of the existing Modo Misto infrastructure.

---

## Scope Summary

| Feature | Route | Description |
|---------|-------|-------------|
| Modo Prompt | `/prompt` | 3-step flow: Input (free text + manual fields) -> Generating -> Results (prompt only, no spec) |
| Modo SaaS Builder | `/saas-spec` | 7-step wizard with structured questions -> Generating -> Full Markdown spec |
| UX/UI Light/Dark | All modes | CSS token system responding to existing `.light`/`.dark` class toggle |

---

## Task 1: Create Modo Prompt (`/prompt`)

Based on the uploaded spec, this mode reuses the `distribute` + `refine` actions from the existing `refine-prompt` edge function but skips the `saas-spec` step.

**New files:**
- `src/pages/prompt/PromptMode.tsx` — Main page component with 3-step state machine (`input` | `generating` | `results`)
- `src/pages/prompt/prompt.css` — Styles (extends misto.css patterns but adapted for 2-panel input layout)
- `src/components/prompt/PromptInput.tsx` — Two-panel layout: left = free text textarea (30-600 chars), right = 6 manual fields with icons/tooltips, separated by "ou" divider. Platform selector pills + Few-Shot toggle at bottom
- `src/components/prompt/PromptGenerating.tsx` — Loading state with field extraction animation + typewriter prompt preview (reuses MistoRefining patterns)
- `src/components/prompt/PromptResults.tsx` — Tabs: "Prompt Final" (structured fields + generated prompt + copy) and "Comparação" (original vs generated). Rating stars, save, new session buttons

**Key differences from Misto:**
- No spec generation step — only distribute + refine
- Two-panel input (free text OR manual fields, not both)
- Few-Shot toggle that calls `get_few_shot_examples` RPC when enabled
- Saves to `sessions` (mode: `prompt`) + `prompt_memory` only (no `saas_specs`)

**Route change in `App.tsx`:**
- Replace `PlaceholderPage` at `/prompt` with `PromptMode`

---

## Task 2: Create Modo SaaS Builder (`/saas-spec`)

A 7-step wizard where each step is a specific question. At the end, calls `saas-spec` action to generate the full Markdown specification.

**New files:**
- `src/pages/saas/SaasMode.tsx` — Main page with step state (1-7 + generating + results), navigation logic, answer aggregation
- `src/pages/saas/saas.css` — Wizard-specific styles
- `src/components/saas/SaasStepper.tsx` — 7-node stepper with gradient active, checkmark done, empty future
- `src/components/saas/SaasStep1.tsx` through `SaasStep7.tsx` — Individual question components:
  1. **O Problema** — Large textarea (min 50 chars) + clickable example + tip
  2. **Público-Alvo** — 3 fields (Segmento, Cargo, Dor) + suggestion chips
  3. **Funcionalidades Core** — Dynamic list (add/remove features, 3-5 items) + suggestion chips
  4. **Modelo de Negócio** — Radio card selection (SaaS, Freemium, Marketplace, etc.) + pricing inputs
  5. **Stack Técnica** — Selectable cards for frontend/backend/database with "Deixar IA decidir" option
  6. **Integrações** — Multi-select toggles (Auth, Payments, Storage, etc.) + custom text input
  7. **Prazo e Prioridades** — Radio for timeline + priority ranking drag or select
- `src/components/saas/SaasGenerating.tsx` — Loading animation with progress phases
- `src/components/saas/SaasResults.tsx` — Spec display in Markdown with copy/download, rating, save

**Navigation:**
- "Anterior" and "Próximo" buttons below each step
- Step 7 shows "Gerar Spec" instead of "Próximo"
- Per-step validation before allowing next

**Route change in `App.tsx`:**
- Replace `PlaceholderPage` at `/saas-spec` with `SaasMode`

---

## Task 3: UX/UI Light/Dark Theme System

The existing `useTheme` hook already toggles `.light`/`.dark` on `<html>`. The misto.css currently uses hardcoded dark colors. This task converts all mode pages to use CSS custom properties that respond to the theme.

**Changes:**
- Add CSS custom property definitions to `src/index.css` that respond to `.dark` and `.light` (root-level):
  - `--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-input`
  - `--border-subtle`, `--border-default`, `--border-focus`
  - `--text-primary`, `--text-secondary`, `--text-muted`
  - `--accent`, `--accent-glow`, `--btn-grad`
  - `--step-*`, `--chip-*`, `--shadow-card`

- Refactor `misto.css` to use `var(--token)` instead of hardcoded HSL/RGBA values. This automatically applies to all three modes since they share the same CSS class names.

- Update `prompt.css` and `saas.css` to also use the token system.

- Remove hardcoded `style={{ background: "hsl(240 20% 3%)" }}` from `MistoMode.tsx` and equivalent pages — use `var(--bg-base)` instead.

- Ensure the existing theme toggle in `AppShell` header also appears in mode page headers (add toggle button to misto/prompt/saas headers).

---

## Task 4: Dashboard Route Updates

- Update Dashboard mode cards to point to correct routes (`/prompt`, `/saas-spec`, `/misto`)
- Mode card for "Modo Misto" already points to `/mixed` — keep both `/mixed` and `/misto` working

---

## Technical Notes

- **Edge Function**: The existing `refine-prompt` function (deployed externally) handles all three actions (`distribute`, `refine`, `saas-spec`). No edge function changes needed.
- **Database**: No schema changes required. All three modes write to existing `sessions`, `prompt_memory`, and `saas_specs` tables with appropriate `mode` values.
- **Shared components**: `CreditModal`, `RatingStars`, and credit logic are reused across all modes.
- **forwardRef warning**: The console shows warnings about `MistoStepper` and `MistoInput` receiving refs. These will be fixed by not passing refs to these function components.

---

## File Creation Summary

```text
New files (14):
  src/pages/prompt/PromptMode.tsx
  src/pages/prompt/prompt.css
  src/components/prompt/PromptInput.tsx
  src/components/prompt/PromptGenerating.tsx
  src/components/prompt/PromptResults.tsx
  src/pages/saas/SaasMode.tsx
  src/pages/saas/saas.css
  src/components/saas/SaasStepper.tsx
  src/components/saas/SaasStep1.tsx
  src/components/saas/SaasStep2.tsx
  src/components/saas/SaasStep3.tsx
  src/components/saas/SaasStep4.tsx
  src/components/saas/SaasStep5.tsx
  src/components/saas/SaasStep6.tsx
  src/components/saas/SaasStep7.tsx
  src/components/saas/SaasGenerating.tsx
  src/components/saas/SaasResults.tsx

Modified files (5):
  src/App.tsx — new routes
  src/index.css — theme tokens
  src/pages/misto/misto.css — convert to CSS vars
  src/pages/misto/MistoMode.tsx — remove hardcoded bg, add theme toggle
  src/pages/Dashboard.tsx — verify route hrefs
```

