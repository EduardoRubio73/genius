

## Problem

Two issues identified:

1. **Wrong redirect URL**: The `create-topup-checkout` Edge Function has hardcoded fallback URLs pointing to `prompt-genius-saas-builder.lovable.app` (old/dead project). After Stripe checkout completes, the user lands on a "Project not found" page. The correct published URL is `genius-engineer.lovable.app`.

2. **Credits not credited**: The webhook flow (`stripe-sync` function) should call `process_credit_purchase` RPC when a topup checkout completes. This may be working but the user couldn't verify because of the broken redirect. We should also confirm the `STRIPE_CHECKOUT_SUCCESS_URL` and `STRIPE_CHECKOUT_CANCEL_URL` env vars are set in Supabase — if they are not set, the `create-checkout-session` function (which uses `!` instead of `||`) would fail, while `create-topup-checkout` falls back to the wrong URL.

## Plan

### 1. Fix hardcoded fallback URLs in `create-topup-checkout`

**File: `supabase/functions/create-topup-checkout/index.ts`** (lines 13-14)

Update the fallback URLs from `prompt-genius-saas-builder.lovable.app` to `genius-engineer.lovable.app`:

```typescript
const successUrl = Deno.env.get("STRIPE_CHECKOUT_SUCCESS_URL") || "https://genius-engineer.lovable.app/billing/success";
const cancelUrl = Deno.env.get("STRIPE_CHECKOUT_CANCEL_URL") || "https://genius-engineer.lovable.app/profile?tab=billing";
```

### 2. Add same fallback pattern to `create-checkout-session`

**File: `supabase/functions/create-checkout-session/index.ts`** (lines 13-14)

Change from `!` (crash if missing) to `||` with correct fallback:

```typescript
const successUrl = Deno.env.get("STRIPE_CHECKOUT_SUCCESS_URL") || "https://genius-engineer.lovable.app/billing/success";
const cancelUrl = Deno.env.get("STRIPE_CHECKOUT_CANCEL_URL") || "https://genius-engineer.lovable.app/profile?tab=billing";
```

### 3. Redeploy both Edge Functions

After the URL fix, redeploy `create-topup-checkout` and `create-checkout-session`.

### 4. Verify credit was granted

Check the `credit_purchases` table for the user's recent purchase to confirm whether the webhook processed it. If the purchase status is still `pending`, the webhook may not have fired or the RPC failed — we can manually process it.

