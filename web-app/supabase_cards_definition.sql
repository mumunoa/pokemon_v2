
-- Pokemon Cards Table Definition
CREATE TABLE public.cards (
    id TEXT PRIMARY KEY, -- cardID from API
    no TEXT,             -- Collection number (e.g., 001/083)
    name TEXT NOT NULL,
    image_url TEXT,
    type TEXT,           -- pokemon, trainer, energy
    kinds TEXT,          -- basic, stage1, stage2, item, supporter, etc.
    hp TEXT,
    types JSONB DEFAULT '[]'::jsonb,      -- Energy types (grass, fire, etc.)
    weakness TEXT,
    resistance TEXT,
    retreat TEXT,
    ability JSONB DEFAULT '[]'::jsonb,
    attacks JSONB DEFAULT '[]'::jsonb,
    rules JSONB DEFAULT '[]'::jsonb,
    support JSONB DEFAULT '[]'::jsonb,
    packs JSONB DEFAULT '[]'::jsonb,
    evolves JSONB DEFAULT '[]'::jsonb,
    roles JSONB DEFAULT '[]'::jsonb,      -- main_attacker, bench_setup, etc.
    archetypes JSONB DEFAULT '[]'::jsonb, -- charizard_ex, etc.
    energy JSONB DEFAULT '[]'::jsonb,     -- Special energy details
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for performance
CREATE INDEX idx_cards_name ON public.cards(name);
CREATE INDEX idx_cards_type ON public.cards(type);
CREATE INDEX idx_cards_kinds ON public.cards(kinds);

-- RLS (Row Level Security)
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.cards;
CREATE POLICY "Allow public read access" ON public.cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service_role insert/update" ON public.cards;
CREATE POLICY "Allow service_role insert/update" ON public.cards FOR ALL USING (true);
