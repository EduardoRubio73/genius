

# Problem: Admin Users Page Not Showing All Users

## Root Cause

The `admin_users_overview` view has `security_invoker=true` and JOINs three tables:
```
profiles p → org_members om → organizations o
```

The super admin has SELECT access on `profiles` and `organizations` (via `admin_profiles_select` and `admin_orgs_select` policies), but **`org_members` has NO super admin SELECT policy**. The only SELECT policy on `org_members` is:

```sql
members_select_same_org: org_id = ANY (get_user_org_ids())
```

This means the super admin can only see `org_members` rows for their **own** organizations. The JOIN silently drops all other users, making only the admin's own account (or orgs they belong to) visible.

## Fix

Add a permissive SELECT policy on `org_members` for super admins:

```sql
CREATE POLICY "admin_org_members_select"
ON public.org_members
FOR SELECT
TO authenticated
USING (is_super_admin());
```

This single migration will fix the admin users page to show all users.

## Files to Change
- **Database migration only** -- no code changes needed.

