-- =============================================
-- Push Subscriptions table for Web Push API
-- (idempotent — safe to run even if table already exists)
-- =============================================

-- 1. Create the table only if it doesn't already exist (minimal baseline)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  subscription  JSONB NOT NULL,
  device_info   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add endpoint column if it is missing (handles tables created without it)
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS endpoint TEXT;

-- 3. Back-fill endpoint from the jsonb for any existing rows (safe no-op when empty)
UPDATE public.push_subscriptions
SET endpoint = subscription->>'endpoint'
WHERE endpoint IS NULL;

-- 4. Now enforce NOT NULL — all rows should have it after the back-fill
ALTER TABLE public.push_subscriptions
  ALTER COLUMN endpoint SET NOT NULL;

-- 5. Unique constraint (drop first so re-runs are idempotent)
ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_endpoint_key;
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id       ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_restaurant_id ON public.push_subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint      ON public.push_subscriptions(endpoint);

-- 7. updated_at trigger (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'push_subscriptions_updated_at'
      AND tgrelid = 'public.push_subscriptions'::regclass
  ) THEN
    CREATE TRIGGER push_subscriptions_updated_at
      BEFORE UPDATE ON public.push_subscriptions
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 8. RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions' AND policyname = 'own_push_subscription_all'
  ) THEN
    CREATE POLICY "own_push_subscription_all"
      ON public.push_subscriptions FOR ALL
      TO authenticated
      USING  (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions' AND policyname = 'superadmin_all_push_subscriptions'
  ) THEN
    CREATE POLICY "superadmin_all_push_subscriptions"
      ON public.push_subscriptions FOR ALL
      TO authenticated
      USING  (public.is_superadmin())
      WITH CHECK (public.is_superadmin());
  END IF;
END $$;

-- 9. Realtime publication (safe to re-run)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
