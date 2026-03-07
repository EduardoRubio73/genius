

## Problem Analysis

The `AdminBillingPlans` component fetches from `v_active_stripe_plans` view, but the code's `PlanRow` type uses column names that don't match the view:

| Code expects | View actually has |
|---|---|
| `product_id` | `id` |
| `unit_amount` (cents) | `price_brl` (decimal BRL) |
| `recurring_interval` | `billing_interval` |
| `plan_tier` | not in view |
| `price_id` | not in view |
| `product_active` / `price_active` | `is_active` |

This causes: prices show R$ 0.00, tier/interval show "—", and the edit form fails to populate correctly because it uses the wrong ID to fetch from `billing_products`.

Additionally, the edit form doesn't populate `display_name`, `plan_tier`, `price (BRL)` properly because the mapping from view data to form is broken.

## Plan

**Single file change: `src/pages/admin/AdminBillingPlans.tsx`**

1. Update `PlanRow` type to match actual view columns: `id`, `name`, `display_name`, `price_brl`, `currency`, `billing_interval`, `credit_unit_cost`, `credits_limit`, `is_featured`, `is_active`, `sort_order`, `stripe_price_id`, `prompts_limit`, `saas_specs_limit`, `modo_misto_limit`, `build_engine_limit`.

2. Fix table rendering:
   - Price: use `price_brl` directly (already in BRL, not cents) -- display as `R$ {price_brl.toFixed(2)}`
   - Interval: use `billing_interval` instead of `recurring_interval`
   - Tier: query from `billing_products` table separately or add a join. Since the view doesn't have `plan_tier`, we'll fetch it alongside via a second query from `billing_products` keyed by `id`.
   - Status: use `is_active` instead of `product_active`

3. Fix `openEdit`: use `row.id` (not `row.product_id`) to query `billing_products` and `billing_prices`. Use `price_brl` for the price field (no division by 100).

4. Fix `createPlan`/`updatePlan` mutations: keep sending `unit_amount` in cents to the Edge Functions (multiply `unit_amount_brl * 100`) -- this part is already correct.

5. Add `plan_tier` to the table by fetching `billing_products` with `id, plan_tier` alongside the view query, and merging them.

**Alternative simpler approach**: Instead of using the view, query `billing_products` joined with `billing_prices` directly. This gives us all needed columns. But since the view already works and has computed fields, I'll keep the view but fix the column mapping and add a supplementary query for `plan_tier`.

