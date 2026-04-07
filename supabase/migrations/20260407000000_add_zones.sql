-- 1. Create the zones table
CREATE TABLE IF NOT EXISTS public.zones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add zone_id to physical_tables
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='physical_tables' AND column_name='zone_id') THEN
    ALTER TABLE public.physical_tables ADD COLUMN zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS Policies for zones
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='zones' AND policyname='superadmin_all_zones') THEN
    CREATE POLICY "superadmin_all_zones" ON public.zones FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='zones' AND policyname='admin_all_zones') THEN
    CREATE POLICY "admin_all_zones" ON public.zones FOR ALL TO authenticated USING (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[])) WITH CHECK (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[]));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='zones' AND policyname='staff_select_zones') THEN
    CREATE POLICY "staff_select_zones" ON public.zones FOR SELECT TO authenticated USING (public.has_role_on_restaurant(restaurant_id, ARRAY['staff']::public.user_role[]));
  END IF;
END $$;

-- 5. Add updated_at trigger
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='zones_updated_at') THEN
    CREATE TRIGGER zones_updated_at BEFORE UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 6. Enable Realtime for zones
-- Note: publication 'supabase_realtime' must already exist. 
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.zones;
    EXCEPTION 
      WHEN OTHERS THEN NULL; -- Ignore if table already in publication
    END;
  END IF;
END $$;
