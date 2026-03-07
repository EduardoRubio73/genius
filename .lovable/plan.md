

## Problem

The "Iniciar BUILD" button only fires a toast (`toast.info("🚀 Modo BUILD iniciado!")`) and does nothing else. The entire 10-step BUILD wizard is unimplemented -- there are no step components, no data collection, no generation flow, and no results display.

The backend (`handleBuild` in `refine-prompt`) already supports the `build` action and expects an `answers` object, returning 10 documents (PRD, ERD, RBAC, UX flows, test plan, roadmap, admin doc, SQL schema, build prompt, deploy guide).

## Plan

### 1. Create Build wizard step components (`src/components/build/`)

Create 10 step components following the SaaS wizard pattern (reusing `misto.css` classes):

| Step | Component | Collects |
|------|-----------|----------|
| 1 | `BuildStep1.tsx` | **Produto**: nome, descrição do problema (textarea, min 50 chars) |
| 2 | `BuildStep2.tsx` | **Público**: segmento, cargo, dor principal |
| 3 | `BuildStep3.tsx` | **Features**: lista de features MVP (add/remove, min 3) |
| 4 | `BuildStep4.tsx` | **Modelo de Receita**: modelo (SaaS/marketplace/freemium/etc), pricing |
| 5 | `BuildStep5.tsx` | **Stack**: frontend, backend, database selectors |
| 6 | `BuildStep6.tsx` | **Infra**: hosting, CI/CD, monitoring choices |
| 7 | `BuildStep7.tsx` | **Auth & Permissões**: auth method, roles list |
| 8 | `BuildStep8.tsx` | **Admin**: admin panel features checklist |
| 9 | `BuildStep9.tsx` | **Integrações**: integration checkboxes + custom input |
| 10 | `BuildStep10.tsx` | **Branding**: nome do app, paleta de cores, tom de comunicação |

Each step receives `answers`, `onChange`, `onNext`, `onPrev`, `canNext` -- same pattern as SaaS steps.

### 2. Create `BuildStepper.tsx`

A 10-step stepper component, same pattern as `SaasStepper`, showing progress through the wizard.

### 3. Create `BuildAnswers` interface

Define the full answers type covering all 10 steps' data.

### 4. Rewrite `BuildMode.tsx`

Replace the stub with a full wizard page following SaaS/Misto layout pattern:
- Misto-style header (back button, badge, theme toggle, credits pill)
- `BuildStepper` for progress
- Step routing (1-10 → generating → results)
- Session creation before generation
- Call `refine-prompt` with `action: "build"` and collected answers
- Results page showing all 10 generated documents with copy/download per document
- ZIP download of all documents using `jszip` (already installed)
- Mark session `completed: true` on finish
- Save to `build_projects` table if it exists, or appropriate storage

### 5. Credit & session flow

- Create session with `mode: "build"` before calling edge function
- Consume credit server-side (already handled by `refine-prompt`)
- Update session to `completed: true` after results

### Files to create
| File | Purpose |
|------|---------|
| `src/components/build/BuildStepper.tsx` | 10-step progress indicator |
| `src/components/build/BuildStep1.tsx` through `BuildStep10.tsx` | Wizard step forms |

### Files to modify
| File | Change |
|------|--------|
| `src/pages/build/BuildMode.tsx` | Full rewrite: wizard flow, generation, results display with ZIP export |

