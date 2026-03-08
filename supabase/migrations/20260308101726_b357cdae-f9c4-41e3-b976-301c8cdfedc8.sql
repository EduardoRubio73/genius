
CREATE OR REPLACE FUNCTION public.check_phone_verified(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.phone_verifications
    WHERE user_id = p_user_id
      AND verified_at IS NOT NULL
  )
$$;
