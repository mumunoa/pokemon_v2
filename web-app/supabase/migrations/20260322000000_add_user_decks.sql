-- Create user_decks table for shared deck history
CREATE TABLE IF NOT EXISTS public.user_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Clerk user ID
    code TEXT NOT NULL,
    name TEXT,
    pinned BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, code)
);

-- Enable RLS
ALTER TABLE public.user_decks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own decks" ON public.user_decks
    FOR ALL USING (user_id = (auth.jwt() ->> 'sub'))
    WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- Indices
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id ON public.user_decks(user_id);
