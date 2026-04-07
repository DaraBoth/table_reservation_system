DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'zones'
      AND policyname = 'staff_all_zones'
  ) THEN
    CREATE POLICY "staff_all_zones"
      ON public.zones
      FOR ALL
      TO authenticated
      USING (
        public.has_role_on_restaurant(
          restaurant_id,
          ARRAY['staff']::public.user_role[]
        )
      )
      WITH CHECK (
        public.has_role_on_restaurant(
          restaurant_id,
          ARRAY['staff']::public.user_role[]
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'physical_tables'
      AND policyname = 'staff_all_tables'
  ) THEN
    CREATE POLICY "staff_all_tables"
      ON public.physical_tables
      FOR ALL
      TO authenticated
      USING (
        public.has_role_on_restaurant(
          restaurant_id,
          ARRAY['staff']::public.user_role[]
        )
      )
      WITH CHECK (
        public.has_role_on_restaurant(
          restaurant_id,
          ARRAY['staff']::public.user_role[]
        )
      );
  END IF;
END $$;