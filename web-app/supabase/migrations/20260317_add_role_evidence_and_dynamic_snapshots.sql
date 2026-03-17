
-- Migration: Add card_dynamic_role_snapshots table for turn-by-turn board state analysis.

CREATE TABLE IF NOT EXISTS public.card_dynamic_role_snapshots (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  session_id TEXT,
  turn_number INTEGER NOT NULL,
  card_id TEXT NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  board_hash TEXT NOT NULL,
  dynamic_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_line TEXT,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  score NUMERIC NOT NULL DEFAULT 0,
  source_action_id TEXT,
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_dynamic_role_snapshots_user_id ON public.card_dynamic_role_snapshots(user_id);
CREATE INDEX idx_dynamic_role_snapshots_session_id ON public.card_dynamic_role_snapshots(session_id);
CREATE INDEX idx_dynamic_role_snapshots_batch ON public.card_dynamic_role_snapshots(session_id, turn_number);

-- RLS
ALTER TABLE public.card_dynamic_role_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow user to read own snapshots" ON public.card_dynamic_role_snapshots;
CREATE POLICY "Allow user to read own snapshots" ON public.card_dynamic_role_snapshots FOR SELECT 
USING (auth.uid()::text = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Allow service_role full access" ON public.card_dynamic_role_snapshots;
CREATE POLICY "Allow service_role full access" ON public.card_dynamic_role_snapshots FOR ALL USING (true);
