-- Add last_ticket_reset_at column if it does not exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_ticket_reset_at TIMESTAMPTZ DEFAULT now();
