

## Problema

Ao abrir o formulário de edição, os campos **Trial days**, **Limite de créditos** e **Limite de membros** sempre mostram os valores padrão (0, 0, 1) porque o `openEdit` não busca esses dados. Eles estão armazenados no campo `metadata` (JSON) das tabelas `billing_products` e `billing_prices`, mas a view `v_active_stripe_plans` não os expõe.

Dados confirmados no banco:
- `billing_products.metadata`: `{"credits_limit": 5, "members_limit": 1, "trial_days": 7}` (Free)
- `billing_prices.metadata`: similar; `trial_period_days` também existe como coluna
- Alguns registros têm `metadata: null` (Starter, Pro)

Também falta a opção `day` no select de intervalo.

## Solução

### 1. `openEdit` — buscar metadata do produto ao abrir

Quando o usuário clica em editar, fazer um fetch rápido de `billing_products` (para `is_featured`, `metadata`) e `billing_prices` (para `trial_period_days`, `metadata`) usando o `product_id` e `price_id` do row. Extrair `credits_limit`, `members_limit`, `trial_days` do metadata e popular o form.

### 2. Adicionar `day` ao select de intervalo

Adicionar `<option value="day">day</option>` e atualizar o tipo `recurring_interval` para incluir `"day"`.

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/AdminBillingPlans.tsx` | `openEdit`: fetch de `billing_products` + `billing_prices` para preencher metadata; adicionar opção `day` no select de intervalo |

### Detalhes

```tsx
// openEdit atualizado
const openEdit = async (row: PlanRow) => {
  setEditing(row);
  // Buscar metadata do produto
  const { data: prod } = await supabase.from("billing_products")
    .select("is_featured, metadata").eq("id", row.product_id).single();
  // Buscar metadata do preço
  const { data: price } = row.price_id 
    ? await supabase.from("billing_prices")
        .select("trial_period_days, metadata").eq("id", row.price_id).single()
    : { data: null };
  
  const prodMeta = (prod?.metadata as any) || {};
  const priceMeta = (price?.metadata as any) || {};
  
  setForm({
    ...formDefaults,
    trial_days: price?.trial_period_days ?? priceMeta.trial_days ?? prodMeta.trial_days ?? 0,
    credits_limit: prodMeta.credits_limit ?? priceMeta.credits_limit ?? 0,
    members_limit: prodMeta.members_limit ?? priceMeta.members_limit ?? 1,
    is_featured: prod?.is_featured ?? false,
    is_active: row.product_active ?? true,
  });
  setOpen(true);
};

// Intervalo: adicionar "day"
<option value="day">day</option>
<option value="month">month</option>
<option value="year">year</option>
```

