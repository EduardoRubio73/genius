

## Plano: Exibir dados completos de cotas, bônus e planos

### Problemas identificados

1. **Dashboard QuotaCard**: O bônus aparece inline como texto pequeno. O usuário quer um card separado para bônus, igual ao de cotas.

2. **ProfilePage > Plano & Cobrança**: Os cards de "Cotas do Plano" e "Cotas Bônus" exibem valores do `useQuotaBalance` que retorna dados corretos do banco (`plan_credits_total=0, plan_credits_used=5, bonus_credits_total=1`). O problema de exibição está correto — o plano free realmente tem 0 créditos totais (foram consumidos além do limite). Os valores estão sendo exibidos.

3. **Cards de planos (ProfilePage e LandingPage)**: Os campos `prompts_label`, `saas_specs_label`, `misto_label`, `build_label`, `members_label`, `total_quotas_label`, `trial_label`, `is_featured`, `features`, `cta_label`, `period_label` **existem na tabela `billing_products`** com dados preenchidos, mas:
   - A view `v_active_stripe_plans` **não expõe essas colunas**
   - O código no `LandingPage` e `ProfilePage` hardcoda `"—"` ou `null` em vez de usar os dados reais

### Solução

#### 1. Migration: Atualizar view `v_active_stripe_plans` para incluir colunas de labels

Adicionar as colunas `is_featured`, `total_quotas_label`, `prompts_label`, `prompts_detail`, `saas_specs_label`, `saas_specs_detail`, `misto_label`, `misto_detail`, `build_label`, `build_detail`, `members_label`, `features`, `trial_label`, `period_label`, `cta_label` à view.

#### 2. Dashboard QuotaCard — Adicionar card separado de Bônus

Reorganizar o `QuotaCard` para mostrar o bônus com a mesma proeminência visual que as cotas do plano: barra de progresso própria, números usados/total, e restantes.

#### 3. ProfilePage `BillingTab` — Usar dados reais da view

Atualizar `useBillingProducts()` para mapear os campos reais da view em vez de hardcodar `null`.

#### 4. LandingPage — Usar dados reais da view

Atualizar o `fetchPricing` para usar os campos reais em vez de `"—"`.

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Recriar view com todas as colunas de labels |
| `src/components/dashboard/QuotaCard.tsx` | Adicionar seção visual de bônus igual à de cotas |
| `src/pages/ProfilePage.tsx` | Mapear campos reais da view no `useBillingProducts` |
| `src/pages/landing/LandingPage.tsx` | Mapear campos reais da view no `fetchPricing` |

