
-- Fix log_change function to handle the cast properly
CREATE OR REPLACE FUNCTION public.log_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.audit_logs (
        org_id, user_id, action, resource_type, resource_id, old_data, new_data
    ) VALUES (
        NULL,
        auth.uid(),
        TG_TABLE_NAME || '.' || lower(TG_OP),
        TG_TABLE_NAME,
        COALESCE(
            CASE WHEN TG_OP != 'DELETE' THEN (to_jsonb(NEW))->>'id' ELSE NULL END,
            CASE WHEN TG_OP != 'INSERT' THEN (to_jsonb(OLD))->>'id' ELSE NULL END
        ),
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    -- Don't block the operation if audit logging fails
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Now backfill the user data
DO $$
DECLARE
    v_user_id uuid := '6908e8cf-7205-4efc-a5b2-a68580e433f5';
    v_email text;
    v_full_name text;
    new_org_id uuid;
    user_slug text;
BEGIN
    SELECT email, raw_user_meta_data->>'full_name'
    INTO v_email, v_full_name
    FROM auth.users WHERE id = v_user_id;

    IF v_email IS NULL THEN RETURN; END IF;

    IF EXISTS (SELECT 1 FROM public.org_members WHERE user_id = v_user_id) THEN
        INSERT INTO public.profiles (id, email, full_name, personal_org_id, onboarded)
        SELECT v_user_id, v_email, v_full_name, om.org_id, false
        FROM public.org_members om WHERE om.user_id = v_user_id LIMIT 1
        ON CONFLICT (id) DO NOTHING;
        RETURN;
    END IF;

    user_slug := lower(regexp_replace(coalesce(v_full_name, split_part(v_email, '@', 1)), '[^a-z0-9]', '-', 'g'))
                 || '-' || substring(gen_random_uuid()::text, 1, 6);

    INSERT INTO public.organizations (
        name, slug, plan_tier, monthly_token_limit, max_members, is_active,
        account_status, trial_started_at, trial_ends_at,
        plan_credits_total, plan_credits_used, bonus_credits_total, bonus_credits_used,
        plan_credits_reset_at
    ) VALUES (
        coalesce(v_full_name, split_part(v_email, '@', 1)), user_slug, 'free', 10000, 1, true,
        'trial', now(), now() + interval '7 days', 5, 0, 0, 0, now() + interval '1 month'
    ) RETURNING id INTO new_org_id;

    INSERT INTO public.org_members (org_id, user_id, role, accepted_at)
    VALUES (new_org_id, v_user_id, 'owner', now());

    INSERT INTO public.profiles (id, email, full_name, personal_org_id, onboarded)
    VALUES (v_user_id, v_email, v_full_name, new_org_id, false)
    ON CONFLICT (id) DO NOTHING;

    PERFORM public.generate_referral_code(new_org_id, v_user_id);
END;
$$;
