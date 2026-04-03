-- Add Special Admin & Features columns to account_memberships
ALTER TABLE public.account_memberships 
ADD COLUMN IF NOT EXISTS is_special_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS special_features TEXT[] DEFAULT '{}';

-- Add helpful comments for the schema
COMMENT ON COLUMN public.account_memberships.is_special_admin IS 'Flag for admins with extended cross-restaurant or special menu permissions.';
COMMENT ON COLUMN public.account_memberships.special_features IS 'List of enabled special feature keys (e.g. create_restaurant, advanced_analytics).';
