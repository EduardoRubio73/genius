

# Fix: Auth error on Skill generation + Custom Skill input

## Problem 1 — "Usuário não autenticado"

The `handleGenerate` function (line 89) checks `!orgId || !user`. The `orgId` comes from `profile?.personal_org_id` which depends on `useProfile(user?.id)`. When the user clicks "Gerar", if the profile query hasn't resolved yet, `orgId` is `undefined` and the toast fires.

**Fix in `PromptMode.tsx`:**
- Add `loading` from `useAuth()` and check if auth is still loading before showing error
- Add a guard: if loading, show "Carregando..." toast instead of "não autenticado"
- Also ensure `fetchBalance` waits for orgId properly

Actually, looking more carefully — the `handleGenerate` dependency array already includes `orgId` and `user` (line 252). The real issue is likely that the user hasn't logged in again after the session expired (the auth logs show logout then login at 16:33). Let me check the `callEdgeFunction` — it throws `"not_authenticated"` on 401, which means the edge function itself is rejecting the JWT.

**Root cause**: The `refine-prompt` edge function validates the JWT. If the session token is expired or the edge function gets a 401, `callEdgeFunction` throws `"not_authenticated"` which is caught at line 247 and displayed as toast. But the `handleGenerate` check at line 89 also shows "Usuário não autenticado" if `user` or `orgId` are null.

**Fix**: Add better error differentiation. But more importantly — check if `user` and `orgId` are actually available. Add a `loading` state guard:

```typescript
const { user, loading: authLoading } = useAuth();
// In handleGenerate:
if (authLoading) { toast.info("Aguarde, carregando sessão..."); return; }
if (!orgId || !user) { toast.error("Usuário não autenticado"); return; }
```

## Problem 2 — Custom Skill has no input

When clicking "➕ Criar Skill Personalizada", `onSelectSkill("custom")` is called. But in `PromptInput.tsx` line 269:
```tsx
{inputMode === "skills" && selectedSkill && selectedSkillData && (
```
`selectedSkillData = findSkillById("custom")` returns `undefined`, so the complement card never renders.

**Fix in `PromptInput.tsx`:**
- Handle `selectedSkill === "custom"` as a special case
- Show a custom input card with fields for skill name and description/instructions
- Add a textarea for the custom skill prompt

```tsx
{inputMode === "skills" && selectedSkill === "custom" && (
  <div className="complement-card" style={{ marginTop: 20 }}>
    <span className="selected-skill-tag">🛠️ Skill Personalizada</span>
    <input placeholder="Nome da skill (ex: Especialista em Next.js)" ... />
    <textarea placeholder="Descreva as instruções do agente..." ... />
  </div>
)}
```

Also update `SkillGroupList.tsx` to toggle "custom" off when clicked again (currently it only sets, never unsets).

## Files to change

| File | Change |
|------|--------|
| `src/pages/prompt/PromptMode.tsx` | Add `authLoading` guard, handle `selectedSkill === "custom"` in generate logic |
| `src/components/prompt/PromptInput.tsx` | Add custom skill card UI when `selectedSkill === "custom"`, add state for custom skill name |
| `src/components/skills/SkillGroupList.tsx` | Toggle "custom" off on re-click |

