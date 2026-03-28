-- =============================================
-- 0001_initial_schema.sql
-- Multi-Tenant Restaurant Reservation System
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM ('superadmin', 'admin', 'staff');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- Core tenant table
CREATE TABLE public.restaurants (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  contact_email           TEXT,
  contact_phone           TEXT,
  address                 TEXT,
  logo_url                TEXT,
  subscription_expires_at TIMESTAMPTZ,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles (shadow table for auth.users)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role assignments: user <-> restaurant <-> role
-- Each user has exactly ONE role in the system (UNIQUE on user_id)
CREATE TABLE public.account_memberships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  role          public.user_role NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- NOTE: restaurant_id = NULL for superadmin (global scope)

-- Physical dining tables
CREATE TABLE public.physical_tables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_name    TEXT NOT NULL,
  capacity      INTEGER NOT NULL DEFAULT 2 CHECK (capacity > 0),
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reservations with tsrange overlap prevention via GiST exclusion constraint
CREATE TABLE public.reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id         UUID NOT NULL REFERENCES public.physical_tables(id) ON DELETE CASCADE,
  guest_name       TEXT NOT NULL,
  guest_phone      TEXT,
  guest_email      TEXT,
  party_size       INTEGER NOT NULL DEFAULT 1 CHECK (party_size > 0),
  notes            TEXT,
  status           public.reservation_status NOT NULL DEFAULT 'pending',
  reservation_time TSRANGE NOT NULL,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- KEY FEATURE: Prevent overlapping bookings for same table (excludes cancelled)
  EXCLUDE USING gist (
    table_id WITH =,
    reservation_time WITH &&
  ) WHERE (status <> 'cancelled')
);

-- Indexes
CREATE INDEX idx_reservations_restaurant_id ON public.reservations(restaurant_id);
CREATE INDEX idx_reservations_table_id ON public.reservations(table_id);
CREATE INDEX idx_reservations_time ON public.reservations USING gist(reservation_time);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_memberships_user_id ON public.account_memberships(user_id);
CREATE INDEX idx_memberships_restaurant_id ON public.account_memberships(restaurant_id);
CREATE INDEX idx_physical_tables_restaurant_id ON public.physical_tables(restaurant_id);

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER restaurants_updated_at     BEFORE UPDATE ON public.restaurants          FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER profiles_updated_at        BEFORE UPDATE ON public.profiles             FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER memberships_updated_at     BEFORE UPDATE ON public.account_memberships  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER physical_tables_updated_at BEFORE UPDATE ON public.physical_tables      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER reservations_updated_at    BEFORE UPDATE ON public.reservations         FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile row on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SECURITY DEFINER HELPERS (avoid recursion, cache uid)
-- =============================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.account_memberships WHERE user_id = (SELECT auth.uid()) AND role = 'superadmin' AND is_active = true);
$$;

CREATE OR REPLACE FUNCTION public.has_role_on_restaurant(p_restaurant_id UUID, p_roles public.user_role[])
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.account_memberships WHERE user_id = (SELECT auth.uid()) AND restaurant_id = p_restaurant_id AND role = ANY(p_roles) AND is_active = true);
$$;

CREATE OR REPLACE FUNCTION public.my_restaurant_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT restaurant_id FROM public.account_memberships WHERE user_id = (SELECT auth.uid()) AND role != 'superadmin' AND is_active = true LIMIT 1;
$$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.restaurants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_tables     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations        ENABLE ROW LEVEL SECURITY;

-- restaurants
CREATE POLICY "superadmin_all_restaurants"  ON public.restaurants FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY "tenant_select_restaurant"    ON public.restaurants FOR SELECT TO authenticated USING (public.has_role_on_restaurant(id, ARRAY['admin','staff']::public.user_role[]));

-- profiles
CREATE POLICY "own_profile_all"             ON public.profiles FOR ALL TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "superadmin_all_profiles"     ON public.profiles FOR SELECT TO authenticated USING (public.is_superadmin());
CREATE POLICY "admin_select_profiles"       ON public.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.account_memberships am WHERE am.user_id = profiles.id AND public.has_role_on_restaurant(am.restaurant_id, ARRAY['admin']::public.user_role[])));

-- account_memberships
CREATE POLICY "superadmin_all_memberships"  ON public.account_memberships FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY "admin_insert_staff"          ON public.account_memberships FOR INSERT TO authenticated WITH CHECK (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[]) AND role = 'staff');
CREATE POLICY "admin_select_memberships"    ON public.account_memberships FOR SELECT TO authenticated USING (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[]));
CREATE POLICY "admin_update_memberships"    ON public.account_memberships FOR UPDATE TO authenticated USING (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[])) WITH CHECK (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[]) AND role = 'staff');
CREATE POLICY "own_membership_select"       ON public.account_memberships FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- physical_tables
CREATE POLICY "superadmin_all_tables"       ON public.physical_tables FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY "admin_all_tables"            ON public.physical_tables FOR ALL TO authenticated USING (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[])) WITH CHECK (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[]));
CREATE POLICY "staff_select_tables"         ON public.physical_tables FOR SELECT TO authenticated USING (public.has_role_on_restaurant(restaurant_id, ARRAY['staff']::public.user_role[]));

-- reservations
CREATE POLICY "superadmin_all_reservations" ON public.reservations FOR ALL TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY "admin_all_reservations"      ON public.reservations FOR ALL TO authenticated USING (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[])) WITH CHECK (public.has_role_on_restaurant(restaurant_id, ARRAY['admin']::public.user_role[]));
CREATE POLICY "staff_select_reservations"   ON public.reservations FOR SELECT TO authenticated USING (public.has_role_on_restaurant(restaurant_id, ARRAY['staff']::public.user_role[]));
CREATE POLICY "staff_insert_reservations"   ON public.reservations FOR INSERT TO authenticated WITH CHECK (public.has_role_on_restaurant(restaurant_id, ARRAY['staff']::public.user_role[]));
CREATE POLICY "staff_update_reservations"   ON public.reservations FOR UPDATE TO authenticated USING (public.has_role_on_restaurant(restaurant_id, ARRAY['staff']::public.user_role[])) WITH CHECK (public.has_role_on_restaurant(restaurant_id, ARRAY['staff']::public.user_role[]));

-- =============================================
-- SEED: SUPERADMIN (login: superadmin / superadmin123)
-- =============================================

DO $$
DECLARE v_uid UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'superadmin@system.local',
    crypt('superadmin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Superadmin"}'::jsonb,
    now(), now(), false
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.account_memberships (user_id, restaurant_id, role)
  VALUES (v_uid, NULL, 'superadmin')
  ON CONFLICT DO NOTHING;
END $$;
