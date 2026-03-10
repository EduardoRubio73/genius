
-- Cancel old manual subscription
UPDATE billing_subscriptions
SET status = 'canceled', canceled_at = now(), ended_at = now(), updated_at = now()
WHERE id = 'sub_manual_rsradio_ea45ffc1';

-- Upsert the real Stripe Enterprise subscription
INSERT INTO billing_subscriptions (id, org_id, price_id, status, current_period_start, current_period_end, updated_at)
VALUES (
  'sub_1T9QadBmEyQZSY7VmuaHo7rj',
  '5b1488f5-5d3c-45ab-acdf-93f151c32111',
  '55b41597-9063-4a4f-bc21-6021a9f5b84d',
  'active',
  to_timestamp(1773150291),
  to_timestamp(1775828691),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  price_id = '55b41597-9063-4a4f-bc21-6021a9f5b84d',
  current_period_start = to_timestamp(1773150291),
  current_period_end = to_timestamp(1775828691),
  updated_at = now();

-- Update org to enterprise (trigger sync_org_plan should fire, but let's be explicit)
UPDATE organizations SET
  plan_tier = 'enterprise',
  plan_credits_total = 228,
  plan_credits_used = 0,
  monthly_token_limit = 9999999,
  max_members = 999,
  account_status = 'active',
  updated_at = now()
WHERE id = '5b1488f5-5d3c-45ab-acdf-93f151c32111';
