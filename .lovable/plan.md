

## Plan: Fix Build Error + Add sessionId to All Edge Function Calls

### Problem 1: Build Error
The file `src/pages/build/BuildMode.tsx` exists but Vite can't resolve `./pages/build/BuildMode` from `src/App.tsx`. The import path needs the `.tsx` extension explicitly, or we switch back to the `@/` alias which works for all other imports in the file.

**Fix**: Change line 23 in `App.tsx` from `import BuildMode from "./pages/build/BuildMode"` back to `import BuildMode from "@/pages/build/BuildMode"`. If this still fails (stale cache), we'll re-save BuildMode.tsx with a trivial comment change to force Vite to re-index it.

### Problem 2: Add sessionId to All Edge Function Calls

Currently, all 4 mode pages call `refine-prompt` without a `sessionId`. The session is only created at save time, but the edge function needs `sessionId` during generation to track token usage. The fix is to create the session **before** calling the edge function, then pass `sessionId` in every request body.

#### Files to Change

1. **`src/App.tsx`** (line 23) — Fix import path to `@/pages/build/BuildMode`

2. **`src/pages/build/BuildMode.tsx`** — In `handleGenerate`:
   - Create session record before the fetch call
   - Pass `sessionId: session.id` in the fetch body
   - Use the same session in `consume_credit` and `handleSave`

3. **`src/pages/misto/MistoMode.tsx`** — In `handleGenerate`:
   - Create session before first fetch call (distribute)
   - Pass `sessionId` in all 3 fetch calls (distribute, refine, saas-spec)
   - Use session.id in `consume_credit` instead of `crypto.randomUUID()`
   - Reuse session in `handleSave`

4. **`src/pages/prompt/PromptMode.tsx`** — In `handleGenerate`:
   - Create session before fetch calls
   - Pass `sessionId` in distribute and refine calls
   - Use session.id in `consume_credit`
   - Reuse session in `handleSave`

5. **`src/pages/saas/SaasMode.tsx`** — In `handleGenerate`:
   - Create session before saas-spec fetch call
   - Pass `sessionId` in the fetch body
   - Use session.id in `consume_credit`
   - Reuse session in `handleSave`

6. **`supabase/functions/refine-prompt/index.ts`** (line 194) — Destructure `sessionId` from body and log it (no functional change needed in the edge function itself since the backend just receives it for context, but we should extract it and potentially use it for token usage tracking).

#### Pattern for Each Mode

```typescript
// Before calling edge function, create session:
const { data: sessionRecord } = await supabase
  .from("sessions")
  .insert({ org_id: orgId, user_id: user.id, mode: "build", tokens_total: 0 })
  .select().single();
const sessionId = sessionRecord?.id;

// In every fetch body, add sessionId:
body: JSON.stringify({ action: "build", answers, sessionId })

// In consume_credit, use real sessionId:
await supabase.rpc("consume_credit", { p_org_id: orgId, p_user_id: user.id, p_session_id: sessionId });

// In handleSave, reuse the stored sessionId instead of creating a new session
```

