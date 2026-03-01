

## Plan: BUILD Engine — Complete 10-Step Wizard

The BUILD Engine will follow the exact same architecture as SaasMode (wizard steps, stepper, generation, results) but with 10 steps covering the full SaaS construction lifecycle. It reuses the existing misto.css styling system.

### 10 Steps

1. **Produto** — Name + core problem description (textarea, min 50 chars)
2. **Público** — Target segment, role, pain point (inputs + suggestion chips)
3. **Features MVP** — Add/remove feature list (min 3 features)
4. **Modelo de Negócio** — Revenue model selection + pricing input
5. **Stack Técnica** — Frontend/backend/DB selectors (or AI decides)
6. **Infraestrutura** — Hosting, CI/CD, environments (selectable chips)
7. **Autenticação** — Auth methods: email/password, OAuth, magic link, etc.
8. **Admin & Painel** — Admin features: dashboard, user management, logs, etc.
9. **Integrações & Pagamentos** — Payment gateways, external APIs, webhooks
10. **Branding & Prazo** — Colors, logo guidelines, timeline, priorities

### Files to Create

1. **`src/components/build/BuildStepper.tsx`** — 10-step stepper (same pattern as SaasStepper)
2. **`src/components/build/BuildStep1.tsx`** through **`BuildStep10.tsx`** — One component per step
3. **`src/pages/build/BuildMode.tsx`** — Main orchestrator (same pattern as SaasMode): state management, generation via `refine-prompt` edge function, credit consumption, save to `build_projects` table, results display with copy/download/ZIP export

### Data Structure

```typescript
interface BuildAnswers {
  projectName: string;
  problema: string;
  segmento: string;
  cargo: string;
  dor: string;
  features: string[];
  modelo: string;
  pricing: string;
  stackFrontend: string;
  stackBackend: string;
  stackDatabase: string;
  hosting: string;
  cicd: string;
  environments: string[];
  authMethods: string[];
  authCustom: string;
  adminFeatures: string[];
  adminCustom: string;
  paymentGateway: string;
  integracoes: string[];
  integracoesCustom: string;
  brandColors: string;
  brandNotes: string;
  prazo: string;
  prioridades: string[];
}
```

### Key Behaviors

- Reuses `misto.css` classes (`saas-wizard-card`, `saas-step-title`, `saas-chip`, `saas-nav-row`, etc.)
- Calls `refine-prompt` edge function with `action: "build-spec"` (falls back to `saas-spec` if not handled)
- Saves to `build_projects` table (already exists with `answers`, `outputs`, `branding` JSONB columns)
- Results page shows generated markdown with copy, download .md, and ZIP export (using jszip)
- Includes `UnifiedMemorySidebar` with `defaultMode="build"`
- Uses `CreditModal` for credit checks

### No Database Changes Needed

The `build_projects` table already exists with the right schema.

