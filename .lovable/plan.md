

## Diagnosis

The error is **not RLS**. The root cause is that all 10 Edge Functions call `anonClient.auth.getClaims(token)`, which **does not exist** in the Supabase JS SDK v2.49.1. This causes a runtime `TypeError: getClaims is not a function`, returning 500 errors.

The `stripe-sync-products` logs confirm this explicitly:
```
TypeError: anonClient.auth.getClaims is not a function
```

## Fix

Replace `getClaims(token)` with `getUser()` in all 10 Edge Functions. Since the client is already initialized with the `Authorization` header, `getUser()` will validate the JWT and return the user.

### Pattern change (in every function):

**Before:**
```ts
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
if (claimsErr || !claimsData?.claims) { return 401; }
```

**After:**
```ts
const { data: { user }, error: userErr } = await anonClient.auth.getUser();
if (userErr || !user) { return 401; }
```

### Affected files (all 10):
1. `supabase/functions/stripe-sync-products/index.ts`
2. `supabase/functions/stripe-sync/index.ts`
3. `supabase/functions/stripe-test-connection/index.ts`
4. `supabase/functions/update-billing-plan/index.ts`
5. `supabase/functions/create-billing-plan/index.ts`
6. `supabase/functions/sync-credit-packs/index.ts`
7. `supabase/functions/consume-credit/index.ts`
8. `supabase/functions/org-dashboard/index.ts`
9. `supabase/functions/org-usage/index.ts`
10. `supabase/functions/org-subscription/index.ts`

Each function needs a 2-line replacement at the auth validation step. No database or RLS changes needed. All functions will be auto-redeployed after editing.

