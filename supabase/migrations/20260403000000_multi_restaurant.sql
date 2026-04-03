-- Allow multiple restaurant memberships per user
ALTER TABLE public.account_memberships DROP CONSTRAINT IF EXISTS account_memberships_user_id_key;

-- Add a unique constraint on (user_id, restaurant_id) to prevent duplicate memberships for the same restaurant
ALTER TABLE public.account_memberships 
ADD CONSTRAINT account_memberships_user_restaurant_unique UNIQUE (user_id, restaurant_id);

-- Update the helper function to handle multiple results gracefully
-- It will return the "first" active membership if no specific restaurant is provided
CREATE OR REPLACE FUNCTION public.my_restaurant_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT restaurant_id 
  FROM public.account_memberships 
  WHERE user_id = (SELECT auth.uid()) 
    AND role != 'superadmin' 
    AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;
$$;
