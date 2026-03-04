

## Plano: Integrar Frontend com Edge Functions de Organização

### Contexto
Atualmente o frontend faz queries diretas ao Supabase (views, RPCs). O objetivo é centralizar em 4 Edge Functions que encapsulam a lógica de negócio no backend.

### 1. Criar 4 Edge Functions

#### `supabase/functions/org-dashboard/index.ts`
- Recebe `{ org_id }`, valida JWT via `getClaims()`
- Retorna: plano atual, créditos (total/usados/restantes), bônus, último consumo, período, account_status
- Fonte: `organizations` + `billing_subscriptions` + `billing_prices` + `billing_products` + `credit_transactions` (último registro)

#### `supabase/functions/org-usage/index.ts`
- Recebe `{ org_id }`
- Retorna: lista de `credit_transactions` ordenada por `created_at DESC`, limitada a 50
- Fonte: `credit_transactions WHERE org_id = p_org_id`

#### `supabase/functions/org-subscription/index.ts`
- Recebe `{ org_id }`
- Retorna: status da assinatura, período atual (start/end), valor do plano, nome do plano, tier
- Fonte: `billing_subscriptions` + `billing_prices` + `billing_products`

#### `supabase/functions/consume-credit/index.ts`
- Recebe `{ org_id, user_id, session_id }`
- Chama `consume_credit(p_org_id, p_user_id, p_session_id)` RPC via service_role
- Retorna `{ success: true }` ou `{ error: "no_credits" | "trial_expired" | "suspended" }`

### 2. Registrar no `supabase/config.toml`
Adicionar `verify_jwt = false` para as 4 novas funções (validação manual via `getClaims()`).

### 3. Atualizar `src/hooks/useQuotaBalance.ts`
- Substituir queries diretas por `callEdgeFunction("org-dashboard", { org_id })`
- Mapear resposta para a interface `QuotaBalance` existente

### 4. Atualizar consumo de crédito nos modos de execução
Nos 4 arquivos que chamam `supabase.rpc("consume_credit", ...)`:
- `src/pages/prompt/PromptMode.tsx`
- `src/pages/misto/MistoMode.tsx`
- `src/pages/saas/SaasMode.tsx`
- `src/pages/build/BuildMode.tsx`

Substituir por `callEdgeFunction("consume-credit", { org_id, user_id, session_id })`.
Se retornar `error === "no_credits"`, bloquear execução e mostrar `CreditModal`.

Também substituir `fetchBalance` (que usa `supabase.rpc("get_credit_balance")`) por `callEdgeFunction("org-dashboard", { org_id })`.

### 5. Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/org-dashboard/index.ts` | Criar |
| `supabase/functions/org-usage/index.ts` | Criar |
| `supabase/functions/org-subscription/index.ts` | Criar |
| `supabase/functions/consume-credit/index.ts` | Criar |
| `supabase/config.toml` | Registrar 4 funções |
| `src/hooks/useQuotaBalance.ts` | Usar `org-dashboard` edge function |
| `src/pages/prompt/PromptMode.tsx` | Usar `consume-credit` edge function |
| `src/pages/misto/MistoMode.tsx` | Usar `consume-credit` edge function |
| `src/pages/saas/SaasMode.tsx` | Usar `consume-credit` edge function |
| `src/pages/build/BuildMode.tsx` | Usar `consume-credit` edge function + fetchBalance |

