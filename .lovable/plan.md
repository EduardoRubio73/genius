

## Plano: Corrigir exibição do plano no Dashboard

### Causa raiz
A edge function `org-dashboard` obtém o `plan_name` exclusivamente da tabela `billing_subscriptions → billing_prices → billing_products`. Se não houver assinatura ativa vinculada, `plan_name` retorna `null`, e o frontend exibe "Free" como fallback.

Porém, a tabela `organizations` já possui o campo `plan_tier` correto (ex: "starter"), que é sincronizado pelo trigger `sync_org_plan`. Este campo não está sendo utilizado.

### Correção

**Arquivo:** `supabase/functions/org-dashboard/index.ts` (linha 70)

Alterar a lógica de `planName` para usar `org.plan_tier` como fallback quando não há subscription:

```ts
// Antes:
const planName = sub?.billing_prices?.billing_products?.display_name 
  ?? sub?.billing_prices?.billing_products?.name 
  ?? null;

// Depois:
const planName = sub?.billing_prices?.billing_products?.display_name 
  ?? sub?.billing_prices?.billing_products?.name 
  ?? org.plan_tier 
  ?? null;
```

Isso garante que mesmo sem subscription ativa, o `plan_tier` da organização ("starter", "pro", etc.) será exibido.

**Arquivo:** `src/pages/Dashboard.tsx` (linhas 320, 337)

Ajustar o fallback para capitalizar o plan_tier (que vem em lowercase):

```ts
// Helper para capitalizar
const displayPlan = (quota?.plan_name ?? "Free").replace(/^\w/, c => c.toUpperCase());
```

Usar `displayPlan` nos dois pontos onde aparece `quota?.plan_name ?? "Free"`.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/org-dashboard/index.ts` | Editar — fallback para `org.plan_tier` |
| `src/pages/Dashboard.tsx` | Editar — capitalizar plan name |

