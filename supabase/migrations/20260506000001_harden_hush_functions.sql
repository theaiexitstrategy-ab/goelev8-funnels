-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
--
-- Harden the SECURITY DEFINER functions created in 20260506000000:
--   1. Pin search_path to `public` so a manipulated search_path can't
--      hijack unqualified table references inside the function body.
--   2. Revoke EXECUTE from anon/authenticated/public so the functions
--      can only be invoked from triggers (which fire under the table
--      owner role) or from the service_role.

ALTER FUNCTION public.update_credit_balance() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_credit_balance() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;
