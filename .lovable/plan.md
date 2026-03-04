

## Plano: Corrigir UI de cotas após upgrade + reset de créditos no webhook

### Problema
Após upgrade, `v_user_plan_balance` retorna `credits_used = credits_limit` porque o contador não foi zerado. A UI mostra barra vermelha e badge "ESGOTADO" mesmo com assinatura ativa.

### Parte 1 — Frontend: `useQuotaBalance.ts`

Incluir `subscription_status` da view no retorno e ajustar a lógica de exibição:

```ts
subscription_status: data.subscription_status ?? null,
```

Recalcular `credits_used` / `credits_remaining` / `percent_used` quando a assinatura está ativa mas os créditos não foram resetados (edge case pós-checkout):

```ts
// Se assinatura ativa e used >= limit, considerar como novo ciclo (reset pendente)
const isNewCycleNotReset = 
  data.subscription_status === 'active' && 
  creditsUsed >= creditsLimit && 
  creditsLimit > 0;

if (isNewCycleNotReset) {
  creditsUsed = 0;
  creditsRemaining = creditsLimit;
  percentUsed = 0;
}
```

### Parte 2 — Frontend: `QuotaCard.tsx`

Badge "ESGOTADO" — já funciona corretamente pois depende de `creditsRemaining <= 0`, que será corrigido pelo hook.

### Parte 3 — Frontend: `Dashboard.tsx`

`noQuota` já depende de `quota.credits_remaining`, que será corrigido pelo hook. Sem mudança necessária.

### Parte 4 — Backend: Edge Function `create-checkout-session`

Após criar a sessão de checkout com sucesso (ou no retorno do webhook), resetar `plan_credits_used` na tabela `organizations`. Como o webhook Stripe ainda não existe, adicionar o reset diretamente na edge function `create-checkout-session` não resolve (o pagamento ainda não foi confirmado).

**Solução correta**: Criar/atualizar a edge function que processa o webhook Stripe (`stripe-sync`) para resetar créditos quando `checkout.session.completed` ou `invoice.payment_succeeded` for recebido.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useQuotaBalance.ts` | Adicionar `subscription_status`, detectar ciclo novo sem reset e zerar contadores |
| `supabase/functions/stripe-sync/index.ts` | Adicionar reset de `plan_credits_used = 0` no evento `checkout.session.completed` |

### Resultado esperado
- Barra volta a 0% após upgrade
- Badge "ESGOTADO" desaparece
- Créditos exibem 0/56 usadas, 56 restantes
- Webhook garante reset real no banco para próximos acessos

