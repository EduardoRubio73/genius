
CREATE OR REPLACE FUNCTION public.update_profile_celular(p_user_id uuid, p_celular text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET celular = p_celular,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;
