

## Analysis: "Limite de envio atingido" on Signup

### Root Cause

The auth logs show:
- User `rsradiotaxi.sor@gmail.com` attempted signup → got **429 `over_email_send_rate_limit`**
- The user ID `b1701425-...` no longer exists in `auth.users` — Supabase created a transient user but the confirmation email was rate-limited

**This is a Supabase platform rate limit**, not a code bug. Supabase's hosted Auth has a default limit of **2 confirmation emails per hour** (configurable in Supabase Dashboard → Auth → Rate Limits). Previous test attempts from the same email/IP exhausted this quota, so even "first" attempts now fail.

### Why it shows on "first" attempt

1. During development/testing, multiple signUp calls were made for the same or different emails
2. Supabase counts ALL confirmation emails globally (per project, per hour)
3. The rate limit persists even if the user was never fully created

### Fix (two parts)

#### 1. Increase Supabase Auth Rate Limits (Dashboard config)
Go to **Supabase Dashboard → Auth → Rate Limits** and increase:
- `RATE_LIMIT_EMAIL_SENT` — default is very low (2-4/hour). Set to 10+ for production.

#### 2. Improve signup resilience in code
The `profiles.update()` call after signup (line 271-274) also silently fails because there's no active session when email confirmation is required. The profile trigger should handle `full_name` from `raw_user_meta_data`, but `celular` is lost.

**Fix**: Save `celular` via a security definer RPC (like we did for phone verification), since the user has no session yet.

### Changes

| Target | Action |
|--------|--------|
| Supabase Dashboard | Increase Auth email rate limits |
| DB migration | Create `update_profile_celular(p_user_id, p_celular)` security definer function |
| `src/pages/Login.tsx` | Use RPC to save celular during signup instead of direct `profiles.update()` |

