-- =============================================
-- Add device_token to push_subscriptions
-- =============================================

-- 1. Add the column if missing
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS device_token UUID;

-- 2. Update the unique constraint
-- Previous: UNIQUE (user_id, endpoint)
-- New: UNIQUE (user_id, device_token)
-- This ensures a user has one subscription per physical device globally. 
-- It allows the user to receive alerts for any restaurant they are a member of.
ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_endpoint_key;

ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_device_token_restaurant_id_key;

ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_device_token_key;

ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_device_token_key 
  UNIQUE (user_id, device_token);


-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device_token 
  ON public.push_subscriptions(device_token);
