

## Exibir planos inativos na view e permitir reativação

### Problema
A view `v_active_stripe_plans` filtra `p.is_active = true AND pr.is_active = true AND pr.stripe_price_id IS NOT NULL`, ocultando planos desativados/arquivados.

### Solução

#### 1. Migration: Recriar a view sem filtro de `is_active`
```sql
CREATE OR REPLACE VIEW v_active_stripe_plans AS
SELECT p.id AS product_id, p.name, p.display_name, p.plan_tier, p.sort_order,
       p.is_active AS product_active,
       pr.id AS price_id, pr.stripe_price_id, pr.unit_amount, pr.recurring_interval,
       pr.is_active AS price_active
FROM billing_products p
LEFT JOIN billing_prices pr ON pr.product_id = p.id
ORDER BY p.sort_order;
```
- Remove filtros `is_active = true` e `stripe_price_id IS NOT NULL`
- Muda JOIN para LEFT JOIN (produtos sem preço também aparecem)
- Adiciona colunas `product_active` e `price_active`

#### 2. `AdminBillingPlans.tsx` — Mostrar status ativo/inativo
- Atualizar `PlanRow` com `product_active` e `price_active`
- Coluna "Status": badge verde "Ativo" ou vermelho "Inativo" baseado em `product_active`
- Planos inativos aparecem na tabela, permitindo clicar em editar e marcar `is_active = true` para reativar

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Recriar view sem filtros de `is_active` |
| `src/pages/admin/AdminBillingPlans.tsx` | Badge dinâmico ativo/inativo, tipos atualizados |

