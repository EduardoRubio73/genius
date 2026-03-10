

# Plano: Corrigir contabilização de créditos + unificar cards Dashboard/Profile

## Problema Principal (Bug Crítico no Backend)

A função `process_credit_purchase` (RPC no Supabase) está **adicionando créditos comprados ao campo errado**:

```sql
-- ATUAL (ERRADO):
UPDATE public.organizations SET
    bonus_credits_total = bonus_credits_total + v_purchase.credits_granted
```

Créditos comprados vão para `bonus_credits_total` (que deveria ser só indicações), mas o frontend lê `extra_credits` de `org_credits.extra_balance` (que nunca é atualizado por compras). Resultado:
- **Bônus** inflado com compras (mostra 11 = 10 de compras + 1?)
- **Créditos Extras** sempre 0 (nunca escrito)
- A compra recente de 40 créditos (`pi_3T9NLtBmEyQZSY7V0rs02wqq`) provavelmente foi para `bonus_credits_total`

## Correções

### 1. Corrigir `process_credit_purchase` (Migration SQL)

Substituir a lógica de adicionar a `bonus_credits_total` por chamar `add_extra_credits()`, que já atualiza corretamente `org_credits.extra_balance` e registra a transação no ledger.

```sql
CREATE OR REPLACE FUNCTION public.process_credit_purchase(...)
-- Remover: UPDATE organizations SET bonus_credits_total = ...
-- Remover: INSERT INTO credit_transactions (manual)
-- Usar: PERFORM add_extra_credits(v_purchase.org_id, v_purchase.credits_granted, 'stripe_topup');
```

### 2. Migrar dados existentes (Migration SQL)

Mover os créditos que foram incorretamente adicionados a `bonus_credits_total` de volta para `org_credits.extra_balance`. Isso requer identificar compras pagas e ajustar os saldos.

```sql
-- Para cada compra paga, reverter de bonus_credits_total e adicionar a extra_balance
UPDATE organizations o SET
    bonus_credits_total = bonus_credits_total - COALESCE(purchased.total, 0)
FROM (
    SELECT org_id, SUM(credits_granted) as total
    FROM credit_purchases WHERE status = 'paid'
    GROUP BY org_id
) purchased
WHERE o.id = purchased.org_id;

UPDATE org_credits oc SET
    extra_balance = extra_balance + COALESCE(purchased.total, 0)
FROM (
    SELECT org_id, SUM(credits_granted) as total
    FROM credit_purchases WHERE status = 'paid'
    GROUP BY org_id
) purchased
WHERE oc.org_id = purchased.org_id;
```

### 3. Processar a compra pendente de 40 créditos

Verificar se a compra com `stripe_payment_intent_id = 'pi_3T9NLtBmEyQZSY7V0rs02wqq'` foi processada. Se estiver `pending`, precisa ser processada manualmente ou o webhook precisa ser re-disparado.

### 4. Unificar cards Profile com Dashboard

**Arquivo**: `src/pages/ProfilePage.tsx`

Substituir os 4 cards antigos (Plano Atual, Cotas Restantes, Bônus, Renovação) pelos mesmos 5 cards do Dashboard:
1. Plano Atual
2. Cotas do Plano
3. Créditos Extras
4. Bônus
5. Saldo Total

Copiar exatamente a mesma estrutura de grid e dados do Dashboard.

## Arquivos a Modificar

1. **Migration SQL** - Corrigir `process_credit_purchase`, migrar dados, processar compra pendente
2. **`src/pages/ProfilePage.tsx`** - Unificar cards com Dashboard (5 indicadores)
3. **`supabase/functions/stripe-sync/index.ts`** - Nenhuma alteração necessária (já chama `process_credit_purchase` corretamente)

