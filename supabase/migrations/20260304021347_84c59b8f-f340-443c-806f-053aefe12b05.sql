
DROP VIEW IF EXISTS public.v_active_stripe_plans;

CREATE VIEW public.v_active_stripe_plans AS
SELECT
  bp.id AS product_id,
  bp.name,
  bp.display_name,
  bp.plan_tier,
  bp.sort_order,
  bp.is_active AS product_active,
  bp.is_featured,
  COALESCE(bp.credits_limit, (bp.metadata->>'credits_limit')::int, 0) AS credits_limit,
  bp.credit_unit_cost,
  bp.credit_costs,
  bp.features,
  bp.cta_label,
  bp.description,
  bpr.id AS price_id,
  bpr.stripe_price_id,
  bpr.unit_amount,
  bpr.recurring_interval,
  bpr.trial_period_days,
  bpr.is_active AS price_active
FROM public.billing_products bp
LEFT JOIN public.billing_prices bpr
  ON bpr.product_id = bp.id;
