-- 002_create_clients.sql
-- Creates the clients table
-- Each client belongs to a coach

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Coaches can see their own clients
CREATE POLICY "clients_select_own" ON public.clients 
  FOR SELECT USING (
    auth.uid() = coach_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'leadership'
    )
  );

-- Coaches can insert their own clients
CREATE POLICY "clients_insert_own" ON public.clients 
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

-- Coaches can update their own clients
CREATE POLICY "clients_update_own" ON public.clients 
  FOR UPDATE USING (auth.uid() = coach_id);

-- Coaches can delete their own clients
CREATE POLICY "clients_delete_own" ON public.clients 
  FOR DELETE USING (auth.uid() = coach_id);

-- Apply updated_at trigger
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for coach lookups
CREATE INDEX idx_clients_coach_id ON public.clients(coach_id);
