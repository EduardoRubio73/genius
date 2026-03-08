

# Fix: Credit Purchase Not Credited

## Immediate Fix (Manual Credit)

First, we need to manually process the most recent purchase to credit the user. We'll use the existing `process_credit_purchase` RPC.

**Step 1**: Execute the RPC to process the latest purchase (assuming the user actually paid via Stripe):
```sql
SELECT process_credit_purchase(
  'c3d79eda-b911-4a3b-a2ca-461f5e9b1118'::uuid,
  ''  -- we don't have the payment_intent_id since webhook never fired
);
```

**Step 2**: Verify the credits were added to `bonus_credits_total` on the org and the `credit_transactions` ledger.

## Root Cause Fix (Webhook Configuration)

The `stripe-sync` Edge Function has **zero logs**, meaning Stripe webhooks are not reaching it. This must be configured in the **Stripe Dashboard**:

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Add endpoint: `https://pcaebfncvuvdguyjmyxm.supabase.co/functions/v1/stripe-sync`
3. Subscribe to events: `checkout.session.completed`, `invoice.payment_succeeded`
4. Copy the webhook signing secret and set it as the `STRIPE_WEBHOOK_SECRET` Supabase secret (already exists but may have the wrong value)

## Technical Details

- The `process_credit_purchase` RPC adds credits to `organizations.bonus_credits_total` and creates a ledger entry in `credit_transactions`
- The second purchase (`89721701...`) from earlier today should also be investigated — if the user paid twice, both need processing
- No code changes are needed; the Edge Function logic is correct, the webhook just isn't reaching it

## Summary of Actions

1. **Data fix**: Call `process_credit_purchase` for the confirmed paid purchase(s)
2. **Webhook setup**: Configure Stripe webhook URL in Stripe Dashboard (manual step)
3. **Verify**: Confirm `STRIPE_WEBHOOK_SECRET` secret matches the Stripe Dashboard value

