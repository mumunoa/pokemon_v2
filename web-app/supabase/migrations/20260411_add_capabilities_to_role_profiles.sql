
-- Migration: Add capabilities and primitives to card_role_profiles for advanced analysis.

ALTER TABLE public.card_role_profiles 
ADD COLUMN IF NOT EXISTS primitives JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS primitive_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS capabilities JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Create GIN index for efficient JSONB querying if people want to search by capability triggers
CREATE INDEX IF NOT EXISTS idx_card_role_profiles_capabilities ON public.card_role_profiles USING GIN (capabilities);
CREATE INDEX IF NOT EXISTS idx_card_role_profiles_primitives ON public.card_role_profiles USING GIN (primitives);
