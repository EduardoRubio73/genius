
Diagnóstico confirmado

- O erro 400 do Stripe está acontecendo, mas a causa não é mais o secret do webhook.
- O webhook entra na Edge Function `stripe-sync`, valida a assinatura e começa a processar.
- O crash ocorre depois, dentro de `upsertSubscriptionFromStripe`, por isso o Stripe mostra 400 para `customer.subscription.created` e `customer.subscription.updated`.

O que encontrei

1. Erro real no `stripe-sync`
- Os logs mostram:
```text
RangeError: Invalid time value
at upsertSubscriptionFromStripe (... stripe-sync/index.ts)
```
- Hoje o código converte diretamente:
```ts
new Date(stripeSubscription.current_period_start * 1000).toISOString()
new Date(stripeSubscription.current_period_end * 1000).toISOString()
```
- No payload atual do Stripe esses campos podem vir ausentes/inválidos no nível da assinatura, então a conversão quebra.

2. O 400 está sendo rotulado de forma enganosa
- O `catch` de `handleStripeWebhook` captura qualquer erro de processamento e responde:
```json
{ "error": "Invalid signature" }
```
- Então o Stripe Dashboard mostra 400 como se fosse assinatura inválida, quando o problema real é falha interna de processamento.

3. O plano não muda porque o upsert da assinatura falha
- `checkout.session.completed` e `invoice.payment_succeeded` chegaram com 200.
- Mas os eventos que realmente mantêm a assinatura sincronizada (`customer.subscription.created/updated`) estão falhando.
- Resultado atual no banco:
  - existe assinatura ativa `sub_1T9QadBmEyQZSY7VmuaHo7rj`
  - a organização `5b1488f5...` continua `plan_tier = free` e `plan_credits_total = 0`
- Ou seja: o estado ficou inconsistente.

4. Há também risco de conflito por assinatura ativa duplicada
- Já apareceu nos logs:
```text
duplicate key value violates unique constraint "uniq_active_subscription_per_org"
```
- Então além da data inválida, o fluxo precisa lidar melhor com assinatura manual/antiga ativa antes de gravar a assinatura real do Stripe.

5. Sobre o bônus “para ambos”
- Pela regra aprovada, bônus de indicação só acontece no primeiro plano pago do indicado.
- No banco, a referral desse org já está `rewarded`.
- Os bônus já foram lançados anteriormente em `org_credits.extra_balance`:
  - org indicado: `extra_balance = 15`
  - org indicador: `extra_balance = 55`
- Portanto, esse novo checkout com erro não deveria gerar bônus novo de novo.

Plano de correção

1. Corrigir `supabase/functions/stripe-sync/index.ts`
- Criar helper seguro para timestamps do Stripe:
  - usar `subscription.items.data[0].current_period_start/end` quando existir
  - usar fallback para campos top-level se vierem
  - converter para ISO só se o valor for numérico válido
  - salvar `null` quando não houver data válida
- Separar erro de assinatura de erro interno:
  - 400 somente quando `constructEventAsync` falhar
  - 500 quando o webhook foi aceito mas o processamento falhou
- Ajustar o upsert para não bater na `uniq_active_subscription_per_org`:
  - cancelar/desativar assinatura ativa antiga do mesmo org quando o `id` da assinatura Stripe for diferente
  - depois gravar a assinatura nova normalmente

2. Corrigir também `supabase/functions/sync-stripe-subscription/index.ts`
- Essa função administrativa repete o mesmo bug de datas.
- Se ela ficar sem correção, o backfill manual continuará quebrando mesmo depois do webhook.

3. Reconciliar os dados após o fix
- Reaplicar a sincronização do org `5b1488f5...` a partir da assinatura ativa real `sub_1T9QadBmEyQZSY7VmuaHo7rj`
- Garantir que a organização volte para o plano correto e recupere os créditos do plano
- Não recalcular bônus de indicação, porque a referral já foi recompensada

4. Validar o fluxo completo
- Reenviar no Stripe os eventos do endpoint:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `invoice.payment_succeeded`
- Resultado esperado:
  - todos retornando 200
  - `billing_subscriptions` consistente
  - `organizations.plan_tier` atualizado
  - créditos do plano refletidos em dashboard/profile
  - nenhum bônus duplicado

Arquivos que precisam de ajuste

- `supabase/functions/stripe-sync/index.ts`
- `supabase/functions/sync-stripe-subscription/index.ts`

Operações de dados necessárias depois do código
- sincronização corretiva do org/assinatura existente
- sem mudança de schema
- sem mudança de RLS

Detalhes técnicos

```text
Stripe Dashboard
  checkout.session.completed      -> 200
  invoice.payment_succeeded       -> 200
  customer.subscription.created   -> 400
  customer.subscription.updated   -> 400

Causa principal
  stripe-sync -> upsertSubscriptionFromStripe ->
  Date(undefined * 1000).toISOString() ->
  RangeError: Invalid time value
```

```text
Efeito no negócio
  assinatura existe no Stripe
  assinatura parcialmente gravada no banco
  org não reflete o plano correto
  créditos do plano não aparecem
  bônus novo não deve ocorrer porque referral já está rewarded
```
