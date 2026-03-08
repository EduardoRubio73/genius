
-- Process pending credit purchase f3dfee14
SELECT public.process_credit_purchase(
  'f3dfee14-d7e4-4e1a-b5c3-9a8f7e6d5c4b'::uuid,
  'manual_fix_2'
);

-- Fallback: if purchase ID doesn't match exactly, process by most recent pending
DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.credit_purchases
  WHERE org_id = 'fb2237bd-3b98-4cbf-b1a2-21a1cba465de'
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    PERFORM public.process_credit_purchase(v_id, 'manual_fix_2');
  END IF;
END;
$$;
