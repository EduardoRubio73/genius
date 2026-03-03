

## Plan: Dynamic Pricing Cards from Database

### Problem
1. Pricing cards on the landing page have **hardcoded wrong prices** (R$37, R$97, R$297) instead of the actual DB values (R$49, R$149, R$499).
2. Card content (quotas, features, trial info) is hardcoded in JSX — user wants to manage it from `billing_products`.

### Database Changes

**Add columns to `billing_products`** to store all card metadata (modeled after the PRO card structure):

```sql
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS total_quotas_label text;        -- e.g. "120 cotas / mês"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS prompts_label text;              -- e.g. "60 / mês"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS prompts_detail text;             -- e.g. "(1 cota)"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS saas_specs_label text;           -- e.g. "30 / mês"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS saas_specs_detail text;          -- e.g. "(2 cotas)"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS misto_label text;                -- e.g. "30 / mês"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS misto_detail text;               -- e.g. "(3 cotas)"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS build_label text;                -- e.g. "24 / mês"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS build_detail text;               -- e.g. "(5 cotas)"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS members_label text;              -- e.g. "Até 10"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'; -- array of {text, included}
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS trial_label text;                -- e.g. "✓ 7 dias grátis"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS period_label text;               -- e.g. "por mês"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS cta_label text;                  -- e.g. "Assinar Pro"
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
```

Then **populate** each product with data matching the reference image:

- **Free**: display_name="Free", prompts="3 / mês", saas_specs="1 / mês", misto="—", build="—", total="5 / mês", features=[{text:"Trial de 7 dias completo",included:true}, {text:"Código de indicação (+5 cotas)",included:true}, {text:"Few-shot learning",included:false}, {text:"Modo Misto",included:false}, {text:"BUILD Engine",included:false}], cta="Começar Grátis", period="para sempre", trial="✓ 7 dias com recursos Basic", sort_order=0
- **Starter (Basic)**: display_name="Basic", price R$49, similar structure with 35 total, sort_order=1
- **Pro**: display_name="Pro", is_featured=true, price R$149, 120 cotas total, sort_order=2
- **Enterprise**: display_name="Enterprise", price R$499, Ilimitado, sort_order=3

### Frontend Changes

**`src/pages/landing/LandingPage.tsx`** — Replace the hardcoded pricing section (lines 424-523) with a dynamic component:
1. Fetch `billing_products` joined with `billing_prices` using `supabase` client (no auth needed — both tables have `SELECT` policy with `true`).
2. Render cards dynamically from the fetched data, mapping `features` JSONB to the feature list, using `unit_amount` from `billing_prices` for the price display.
3. Keep the same CSS classes (`pc`, `pc-name`, `pc-price`, `lrow`, etc.) for visual consistency.

### Summary
- 1 migration: add ~17 columns to `billing_products` + populate data
- 1 file edited: `LandingPage.tsx` — dynamic pricing cards from DB
- Prices will always match `billing_prices.unit_amount`
- User can update all card content directly from the `billing_products` table

