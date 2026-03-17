
-- Migration: Add card_role_profiles table for static card role analysis.

CREATE TABLE IF NOT EXISTS public.card_role_profiles (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  static_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  deck_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  dynamic_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_score NUMERIC DEFAULT 0,
  labels JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC DEFAULT 0,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  inferred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(card_id, version)
);

-- Indices
CREATE INDEX idx_card_role_profiles_card_id ON public.card_role_profiles(card_id);
CREATE INDEX idx_card_role_profiles_version ON public.card_role_profiles(version);

-- RLS
ALTER TABLE public.card_role_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.card_role_profiles;
CREATE POLICY "Allow public read access" ON public.card_role_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service_role full access" ON public.card_role_profiles;
CREATE POLICY "Allow service_role full access" ON public.card_role_profiles FOR ALL USING (true);
