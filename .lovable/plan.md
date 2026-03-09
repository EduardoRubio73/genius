
# Plano: Corrigir Checkout Stripe + Badge Clicável + Sincronização

## Problemas Identificados

### 1. Tela Preta após Checkout
- O checkout Stripe usa o **domínio antigo** `prompt-genius-saas-builder.lovable.app` (não existe mais)
- O redirect `STRIPE_CHECKOUT_SUCCESS_URL` aponta para `genius-engineer.lovable.app/billing/success`
- Quando o usuário vem de outro domínio, o redirect funciona mas a **página de sucesso pode não ter a sessão Supabase válida**, causando tela preta

### 2. Créditos Não Creditados
- A query mostra que o usuário tem `plan_tier='free'`, `plan_credits_total=5` (trial)
- **NÃO HÁ** registro em `billing_subscriptions` para esse org
- O **webhook do Stripe não está criando a subscription no banco**
- O `stripe-sync` endpoint espera processar webhooks, mas precisa:
  - Criar `billing_subscriptions` quando `checkout.session.completed` com `mode=subscription`
  - Atualizar `organizations.plan_tier` e `plan_credits_total`

### 3. Badge não clicável (pendente)

---

## Plano de Correção

### Parte 1: Corrigir Webhook `stripe-sync`

Atualizar a Edge Function para:
1. No evento `checkout.session.completed` com `mode=subscription`:
   - Recuperar `subscription` via Stripe API
   - Criar registro em `billing_subscriptions`
   - Chamar trigger `sync_org_plan` (já existe) para atualizar `organizations`
2. Adicionar tratamento para `customer.subscription.created` e `customer.subscription.updated`

### Parte 2: Criar Endpoint Admin de Sincronização

Criar `sync-stripe-subscription` para backfill:
1. Super admin only
2. Recebe `org_id`
3. Busca `stripe_customer_id` da org
4. Lista subscriptions do customer no Stripe
5. Cria/atualiza `billing_subscriptions` + atualiza org

### Parte 3: Badge Clicável

No `Dashboard.tsx` e `ProfilePage.tsx`:
- Adicionar `onClick` ao badge do plano que abre a seção "Planos disponíveis"
- No ProfilePage: scroll até a seção de planos
- No Dashboard: navegar para `/profile?tab=billing`

---

## Arquivos a Modificar

1. **`supabase/functions/stripe-sync/index.ts`** - Corrigir webhook para criar subscription
2. **`supabase/functions/sync-stripe-subscription/index.ts`** - CRIAR endpoint admin de backfill
3. **`src/pages/Dashboard.tsx`** - Badge clicável
4. **`src/pages/ProfilePage.tsx`** - Badge clicável + scroll to plans

---

## Correção Imediata para Usuário

Após implementação, usaremos o endpoint admin para sincronizar a subscription do usuário `rsradiotaxi.sor@gmail.com` sem cobrar novamente.

