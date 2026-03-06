# Manual Técnico — Arquitetura de Créditos, Bônus, Referrals e Billing

> Objetivo: descrever, de forma reprodutível, a arquitetura de billing do sistema SaaS (Supabase + Stripe), incluindo dados, regras de negócio, segurança, automações, triggers, funções SQL e fluxos de pagamento.

---

## 1) Arquitetura Geral

### 1.1 Modelo multi-tenant
- O tenant lógico é a **organização** (`organizations.id`).
- Usuários (`auth.users`) são ligados ao domínio da aplicação via `profiles.id` e `org_members.user_id`.
- Cada recurso de negócio (sessões, billing, créditos, referrals) referencia `org_id` para isolamento.

### 1.2 Relações principais
- `profiles.personal_org_id` define a organização principal do usuário.
- `org_members` define associação N:N usuário ↔ organização e papel (`owner`, `admin`, `member`, `viewer`).
- `billing_subscriptions.org_id` define assinatura ativa da organização.
- `org_credits.org_id` mantém saldo operacional de créditos do tenant.

### 1.3 Isolamento de dados
- Isolamento primário: RLS por `org_id` (função `get_user_org_ids()` + `is_super_admin()`).
- Edge Functions reforçam o isolamento em camada de aplicação validando JWT + membership (`org_members`).

### 1.4 Domínios de crédito
Existem três camadas de crédito em paralelo:
1. **Plano**: `organizations.plan_credits_total` e `organizations.plan_credits_used`.
2. **Bônus referral/promo**: `organizations.bonus_credits_total` e `organizations.bonus_credits_used`.
3. **Extra/top-up**: `org_credits.extra_balance` (e `org_credits.balance` para ciclo principal no motor novo).

---

## 2) Sistema de Planos (Subscriptions)

### 2.1 Catálogo
- `billing_products`: produto/plano (tier, limites, labels comerciais, metadata, IDs Stripe).
- `billing_prices`: preço recorrente (valor, moeda, intervalo, trial, ID Stripe).
- `billing_plan_features`: features por plano (ex.: `monthly_credits`) com `limit_value`.

### 2.2 Assinatura por organização
- `billing_subscriptions` guarda estado de assinatura por org.
- Índice único parcial garante **uma assinatura ativa por org** (`active|trialing|past_due`).

### 2.3 Estados de assinatura
Enum `subscription_status`:
`trialing`, `active`, `incomplete`, `incomplete_expired`, `past_due`, `canceled`, `unpaid`, `paused`.

### 2.4 Governança de ativação da conta
Trigger `trg_sync_org_activation_from_subscription`:
- `status in ('active','trialing')` → `organizations.is_active = true`.
- demais estados → `organizations.is_active = false`.

---

## 3) Sistema de Créditos

### 3.1 Ledger e saldo
- Ledger de eventos: `credit_transactions` (origem, valor, referência, saldo pós-operação).
- Compras: `credit_purchases`.
- Saldo agregado por org: `org_credits` (`balance`, `extra_balance`).

### 3.2 Campos de consumo no tenant
- Plano: `plan_credits_total`, `plan_credits_used`.
- Bônus: `bonus_credits_total`, `bonus_credits_used`.
- Reset do plano: `plan_credits_reset_at`.

### 3.3 Origens formais
Enum `credit_origin`:
- `purchase`
- `referral_gave`
- `referral_got`
- `bonus`
- `plan_reset`

### 3.4 Prioridade de exibição de saldo
Fluxos de dashboard consolidam:
- `plan_remaining = max(plan_total - plan_used, 0)`
- `bonus_remaining = max(bonus_total - bonus_used, 0)`
- `total_remaining = plan_remaining + bonus_remaining + extra_balance`

---

## 4) Sistema de Bônus

### 4.1 Fontes
- Referral (referrer + invitee).
- Crédito administrativo/promoção (`add_extra_credits`, `origin=bonus`).

### 4.2 Persistência
- Bônus referral ficam rastreados em `referrals` e refletidos em `organizations.bonus_*` + `credit_transactions`.
- Bônus extra operacional pode ir para `org_credits.extra_balance`.

### 4.3 Regras de elegibilidade observadas no produto
- Geração de código referral bloqueada para plano `free` (retorno `plan_required`).
- Mensagem de UX confirma recompensa após ativação de plano pago do convidado.

---

## 5) Sistema de Indicações (Referrals)

### 5.1 Entidades
- `referral_codes`: código por org/usuário, limite de uso e contador.
- `referrals`: evento de indicação com status e créditos para ambos lados.
- `referral_clicks`: telemetria de clique.

### 5.2 Estados
Enum `referral_status`: `pending`, `completed`, `rewarded`, `expired`.

### 5.3 RPCs
- `generate_referral_code(p_org_id, p_user_id) -> text`
- `process_referral(p_code, p_invitee_org, p_invitee_user) -> text`
- `reward_referral_if_paid(p_org_id) -> void`

### 5.4 Contratos de retorno inferidos pela aplicação
`process_referral` pode retornar:
- `ok_trial`
- `invalid_code`
- `own_code`
- `already_used`

`generate_referral_code` pode retornar:
- código alfanumérico
- `plan_required`

---

## 6) Sistema de Compra de Créditos (Top-up)

### 6.1 Catálogo top-up
- `credit_packs`: pacote (quantidade créditos, preço BRL, Stripe price, destaque).
- Enum `credit_pack_size`: `pack_5`, `pack_15`, `pack_40`.

### 6.2 Fluxo técnico
1. Cliente chama Edge Function `create-topup-checkout` com `pack_id` (+ opcional `org_id`).
2. Função valida JWT e associação `org_members`.
3. Cria registro `credit_purchases` com `status='pending'`.
4. Cria Stripe Checkout (`mode='payment'`) com `purchase_id` em metadata.
5. Webhook `checkout.session.completed` chama RPC `process_credit_purchase(p_purchase_id, p_stripe_pi_id)`.
6. RPC deve marcar compra como paga e creditar org (ledger + saldo).

### 6.3 Pré-condições
- pacote ativo (`credit_packs.is_active = true`)
- pacote com `stripe_price_id` configurado
- usuário membro da org

---

## 7) Regras de Consumo de Créditos

### 7.1 Ponto de entrada
- Edge Function `consume-credit` recebe: `org_id`, `user_id`, `session_id`.
- Função valida JWT e delega à RPC `consume_credit` com service role.

### 7.2 Resultado esperado
Contratos usados no backend/frontend:
- `ok`
- `no_credits`
- `trial_expired`
- `suspended`

### 7.3 Regra operacional
- Cada execução de produto (prompt/spec/build) consome crédito via RPC.
- Histórico auditável em `credit_transactions`.

### 7.4 API auxiliar
- RPC `api_consume_credit(p_org_id, p_user_id, p_session_id) -> json`
- RPC `check_org_credits(p_org_id)` e `get_credit_balance(p_org_id)` para consulta.

---

## 8) Segurança e RLS

### 8.1 Políticas centrais
- `billing_products`, `billing_prices`, `billing_plan_features`: leitura autenticada geral; escrita somente super-admin.
- `billing_subscriptions`, `org_credits`: leitura por membro da org ou super-admin; escrita apenas super-admin.
- `organizations`: leitura/edição para super-admin ou org pessoal do usuário (policy específica).

### 8.2 Guard de contexto organizacional
Funções SQL:
- `get_request_org_id()` lê claim `org_id` do JWT.
- `assert_org_context_access(p_org_id)` garante:
  - usuário autenticado
  - claim `org_id` compatível (quando presente)
  - `p_org_id` pertence a `get_user_org_ids()`

### 8.3 Segurança na camada Edge
- `create-checkout-session` e `create-topup-checkout` fazem validação de membership via `org_members` antes de agir.
- Funções sensíveis usam `SUPABASE_SERVICE_ROLE_KEY` apenas no backend server-side.

---

## 9) Fluxos Automatizados

### 9.1 Automação de status
`update_subscription_status_automatically()`:
- ativa → `past_due` quando `current_period_end < now()`.
- ativa/trialing/past_due → `canceled` quando `cancel_at <= now()`.

Scheduler (quando extensão `cron` existe):
- job `billing-status-automation-every-5-minutes`
- periodicidade: `*/5 * * * *`.

### 9.2 Reset automático de créditos de plano
Trigger `trg_apply_plan_credits_on_period_start`:
- em insert/update de assinatura (mudança de período/preço)
- resolve feature `monthly_credits` do plano
- upsert em `org_credits.balance`

Função complementar de lote:
- `reset_org_credits_bulk()` para uso por cron/manual.

### 9.3 Sincronização catálogo ↔ Stripe
- Triggers DB em `billing_products` e `billing_prices` disparam `dispatch_stripe_sync_event()`.
- Payload é enviado para webhook configurado em `app.settings.stripe_sync_webhook_url`.
- Edge Function `stripe-sync` cria/atualiza produto/preço no Stripe e grava IDs sync.

---

## 10) Funções SQL (Inventário operacional)

### 10.1 Autorização/contexto
- `is_super_admin()`
- `is_org_admin(p_org_id)`
- `get_user_org_ids()`
- `get_request_org_id()`
- `assert_org_context_access(p_org_id)`

### 10.2 Billing/assinatura
- `change_subscription_plan(p_org_id, p_new_price_id)`
- `update_subscription_status_automatically()`
- `has_org_feature(p_org_id, p_feature_key)`

### 10.3 Créditos
- `consume_credit(p_org_id, p_user_id, p_session_id)`
- `api_consume_credit(...)`
- `get_credit_balance(p_org_id)`
- `check_org_credits(p_org_id)`
- `add_extra_credits(p_org_id, p_credits, p_source)`

### 10.4 Referral e compras
- `generate_referral_code(...)`
- `process_referral(...)`
- `reward_referral_if_paid(...)`
- `process_credit_purchase(p_purchase_id, p_stripe_pi_id)`

### 10.5 Consulta e observabilidade
- `get_org_dashboard`, `get_org_stats`, `get_token_budget`
- visões: `billing_dashboard`, `org_active_features`, `org_usage_view`, `v_user_plan_balance`, `v_active_stripe_plans`

---

## 11) Triggers

### 11.1 Integridade catálogo
- `trg_enforce_billing_prices_integrity` (before insert/update em `billing_prices`)
- `trg_enforce_billing_products_integrity` (before update em `billing_products`)

Regra:
- preço ativo exige produto ativo.
- produto ativo exige ao menos um preço ativo.

### 11.2 Ativação de organização
- `trg_sync_org_activation_from_subscription` (after insert/update status em `billing_subscriptions`).

### 11.3 Aplicação de créditos por ciclo
- `trg_apply_plan_credits_on_period_start` (after insert/update de período/plano em `billing_subscriptions`).

### 11.4 Provisionamento inicial de carteira
- `trg_create_org_credits` (after insert em `billing_subscriptions`) → `ensure_org_credits()`.

### 11.5 Dispatch para sync Stripe
- `trg_dispatch_stripe_product_sync` (after insert/update em `billing_products`).
- `trg_dispatch_stripe_price_sync` (after insert/update em `billing_prices`).

---

## 12) Fluxos de Pagamento

### 12.1 Assinatura de plano (Checkout subscription)
1. Frontend chama `create-checkout-session` com `price_id` (+ contexto org).
2. Função resolve org via payload/header/JWT/profile.
3. Valida acesso do usuário à org (`org_members`).
4. Valida preço local ativo e sincronizado (`billing_prices.stripe_price_id`).
5. Cria/reutiliza `stripe_customer_id` na organização.
6. Cria Stripe Checkout (`mode='subscription'`) com metadata (`org_id`, `billing_price_id`).
7. Após pagamento, assinatura deve existir/ser atualizada em `billing_subscriptions`.
8. Triggers/funções atualizam ativação da org e créditos de ciclo.

### 12.2 Compra avulsa de créditos (Checkout payment)
1. Frontend chama `create-topup-checkout` com `pack_id`.
2. Cria `credit_purchases` pendente.
3. Stripe Checkout concluído gera webhook.
4. `stripe-sync` (webhook handler) invoca `process_credit_purchase`.
5. Compra marcada como paga + crédito lançado em saldo/ledger.

### 12.3 Renovação recorrente
- Evento `invoice.payment_succeeded` aciona reset de consumo de créditos de plano (atualmente via update em `organizations.plan_credits_used=0`).
- Fluxo coexistente com motor novo de `org_credits.balance`; em replicação, escolher um único mecanismo de source-of-truth para evitar dupla contabilidade.

---

## 13) Blueprint de Reprodução em Outra Plataforma

### 13.1 Ordem recomendada de implementação
1. **Schema base**: `organizations`, `profiles`, `org_members`.
2. **Catálogo billing**: `billing_products`, `billing_prices`, `billing_plan_features`.
3. **Assinatura e carteira**: `billing_subscriptions`, `org_credits`.
4. **Ledger**: `credit_transactions`, `credit_purchases`, `credit_packs`.
5. **Referral**: `referral_codes`, `referrals`, `referral_clicks`.
6. **RLS + helpers auth**.
7. **Triggers de integridade e automação**.
8. **Edge/webhooks Stripe**.

### 13.2 Requisitos mínimos de consistência
- impedir mais de uma assinatura ativa por org;
- impedir produto ativo sem preço ativo;
- tornar `credit_transactions` a trilha auditável oficial;
- validar org context em **todas** as mutações financeiras;
- tratar webhooks Stripe com idempotência por `event.id` (recomendação mandatória na réplica).

### 13.3 Recomendação de simplificação para réplicas
O repositório mostra coexistência de dois modelos (contadores em `organizations` e carteira `org_credits`).
Para nova implementação, padronizar em:
- saldo operacional em `org_credits`;
- ledger em `credit_transactions`;
- `organizations.*_credits_*` apenas para compatibilidade/analytics (ou remover).

---

## 14) Checklist de Validação Pós-Implantação

1. Criar plano e preço ativos.
2. Criar checkout de assinatura e concluir pagamento.
3. Verificar `billing_subscriptions`, `org_credits`, `billing_dashboard`.
4. Consumir crédito via RPC e validar ledger.
5. Comprar top-up e validar `credit_purchases` + saldo.
6. Executar referral ponta-a-ponta com recompensa.
7. Validar RLS com usuário fora da org (deve falhar).
8. Validar job de status automático.
9. Validar sync catálogo com Stripe (create/update/deactivate).

---

## 15) Observações de Engenharia

- `stripe-sync` tem duas responsabilidades: sync catálogo e webhook Stripe; em ambientes de alta escala, separar em funções independentes.
- Mantenha `service_role` restrito a Edge Functions server-side.
- Adote monitoramento de falhas de webhook e fila de retry.
- Não confiar apenas no frontend para elegibilidade de referral/crédito; regras finais devem viver em RPC SQL transacional.
