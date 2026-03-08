

# Security Scan Results & Fix Plan

## Scan Summary (5 findings)

| # | Finding | Level | Status |
|---|---------|-------|--------|
| 1 | Leaked Password Protection Disabled | warn | **Manual** -- requires Supabase Dashboard |
| 2 | Phone verification bypass | error | **Fix required** |
| 3 | Admin overview views expose PII | error | **Already mitigated** -- views have `WHERE is_super_admin()` + `security_invoker=true` |
| 4 | phone_verifications_status view unprotected | error | **Already mitigated** -- `security_invoker=true` delegates to base table RLS |
| 5 | Org financial views lack row isolation | warn | **Already mitigated** -- `security_invoker=true` + base tables have org-scoped RLS |

## Analysis

**Findings 3, 4, 5** are false positives from the scanner. The views already have `security_invoker = true` set (confirmed via `pg_class.reloptions`), which means they run queries as the calling user and respect RLS on base tables. The base tables (`credit_transactions`, `organizations`, `org_credits`, etc.) all have RLS enabled with proper org-scoped policies. The scanner flags these because views themselves don't have RLS rows in `pg_policies`, but `security_invoker` makes that unnecessary.

**Finding 1** (Leaked Password Protection) is a Supabase Dashboard toggle -- cannot be fixed via code.

**Finding 2** (Phone verification bypass) is the only real vulnerability that needs a code fix.

## Finding 2: Phone Verification Bypass -- Fix Plan

**The problem**: The `phone_verifications` table has an INSERT policy (`auth.uid() = user_id`) that lets any authenticated user insert a row with a **self-chosen code**. They can then call `verify_phone_code` with that known code and pass verification without ever receiving an SMS.

**The fix** (single migration):

1. **Revoke INSERT** privilege on `phone_verifications` from `anon` and `authenticated` roles
2. **Drop the INSERT RLS policy** (no longer needed since direct access is revoked)
3. **Drop the SELECT RLS policy** (SELECT was already revoked previously; policy is orphaned)
4. **Drop the UPDATE RLS policy** (updates happen only via SECURITY DEFINER functions)
5. The existing `insert_phone_verification()` function is already `SECURITY DEFINER` and handles inserts server-side -- no changes needed there

After this fix, the only way to create a verification record is through `insert_phone_verification()` (SECURITY DEFINER), and the only way to verify is through `verify_phone_code()` (SECURITY DEFINER). No client can bypass the code generation.

## Findings 3-5: Mark as resolved

These will be marked as resolved/ignored in the security tracking since the `security_invoker = true` protection is already in place.

## Summary of changes

- **1 database migration**: Revoke direct INSERT on `phone_verifications`, drop orphaned RLS policies
- **3 security findings marked resolved**: Admin views, phone_verifications_status, org financial views
- **No edge function or frontend changes needed**

