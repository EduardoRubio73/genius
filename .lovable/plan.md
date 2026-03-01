

## Plan: Implement BUILD Mode — AI SaaS Construction Engine

### Summary
Add a 4th mode ("BUILD") that orchestrates a 10-step wizard transforming an idea into a complete, deployable SaaS package with PRD, ERD, RBAC, SQL schema, auth, admin, branding, and export-ready documentation.

### Database Changes

**Migration**: Add `build` to the `session_mode` enum so sessions can track BUILD mode usage.

```sql
ALTER TYPE session_mode ADD VALUE 'build';
```

**New table `build_projects`** to store BUILD outputs:
- `id`, `org_id`, `user_id`, `session_id`
- `project_name`, `answers` (jsonb — all 10 steps)
- `outputs` (jsonb — PRD, ERD, RBAC, SQL, roadmap, etc.)
- `branding` (jsonb — name, colors, logo style, icon)
- `rating`, `is_favorite`, `created_at`, `updated_at`
- RLS: org-scoped select, user-scoped insert/update/delete

### New Files

1. **`src/pages/build/BuildMode.tsx`** — Main orchestrator page (mirrors SaasMode pattern):
   - 10-step wizard + "generating" + "results" states
   - Credit check, auth headers, save to `build_projects` + `sessions`
   - UnifiedMemorySidebar with `defaultMode="build"`

2. **`src/components/build/BuildStepper.tsx`** — 10-step progress indicator

3. **`src/components/build/BuildStep1.tsx` through `BuildStep10.tsx`** — One component per step:
   - Step 1: Product Definition (problem, target user, core features, platform type)
   - Step 2: Infrastructure Choice (Lovable Cloud vs External Supabase)
   - Step 3: Auth Setup (login?, roles?, RLS?)
   - Step 4: Admin Panel (need dashboard?, roles, permissions)
   - Step 5: Multi-Tenant (yes/no, tenant structure)
   - Step 6: Payments (billing?, Stripe?, plans)
   - Step 7: Branding (app name, logo style, colors, icon)
   - Step 8: PWA (manifest, offline support toggle)
   - Step 9: Doc Generation preview (shows what will be generated)
   - Step 10: Review & Generate (summary of all choices)

4. **`src/components/build/BuildResults.tsx`** — Tabbed results view:
   - **Docs** tab: PRD, UX Flows, Roadmap rendered as markdown
   - **SQL** tab: Copy-ready schema with auth/core/admin/billing tables
   - **Prompts** tab: Lovable-ready build prompt
   - **Deploy Guide** tab: Step-by-step launch instructions
   - Download all as ZIP button

5. **`src/components/build/BuildExportZip.tsx`** — ZIP generation utility using JSZip (new dependency) to bundle docs, SQL, branding config, and build prompt

### Edge Function Changes

**`supabase/functions/refine-prompt/index.ts`**: Add new action `"build"` handler:
- Receives all 10 steps' answers as structured input
- Calls LLM with a comprehensive system prompt to generate:
  - `prd_md`, `erd_md`, `rbac_md`, `ux_flows_md`, `test_plan_md`, `roadmap_md`, `admin_doc_md`
  - `sql_schema` (complete SQL with RLS)
  - `build_prompt` (Lovable-ready prompt)
  - `deploy_guide_md`
- Uses `max_tokens: 8192` for the larger output
- Returns all outputs as JSON

### Route & Navigation

- Add `/build` route in `App.tsx` wrapped in `<AuthGuard>`
- Add BUILD mode card to Dashboard's `modes` array with icon `Rocket` and tags `["PRD", "SQL", "Deploy-ready"]`

### Dependencies

- Add `jszip` package for ZIP export functionality

### Technical Notes
- Each BUILD step component follows the exact same pattern as SaasStep1-7 (chip selectors, text inputs, nav buttons)
- The edge function will make a single LLM call with all context rather than multiple calls, to keep it within 1 credit
- BUILD results page uses the existing `misto.css` classes for consistency
- The `build_projects.outputs` jsonb column stores all generated documents, allowing lazy rendering per tab

