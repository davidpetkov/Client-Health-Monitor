-- 003_create_health_checkins.sql
-- Creates the health_checkins table for weekly client assessments
-- Two scores per check-in: current_score and predictive_score (1-5)
-- action_items required when predictive_score < 5

CREATE TABLE IF NOT EXISTS public.health_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Week tracking (defaults to most recent Friday)
  week_of DATE NOT NULL DEFAULT (
    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INT + 
    CASE WHEN EXTRACT(DOW FROM CURRENT_DATE)::INT >= 5 THEN 5 ELSE -2 END
  )::DATE,
  
  -- Two separate scores as per assessment requirements
  current_score INT NOT NULL CHECK (current_score >= 1 AND current_score <= 5),
  predictive_score INT NOT NULL CHECK (predictive_score >= 1 AND predictive_score <= 5),
  
  -- Notes and action items
  notes TEXT,
  action_items TEXT, -- Required when predictive_score < 5 (enforced at app level)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one check-in per client per week
  UNIQUE(client_id, week_of)
);

-- Enable RLS
ALTER TABLE public.health_checkins ENABLE ROW LEVEL SECURITY;

-- Coaches can see their own check-ins, leadership can see all
CREATE POLICY "health_checkins_select" ON public.health_checkins 
  FOR SELECT USING (
    auth.uid() = coach_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'leadership'
    )
  );

-- Coaches can insert check-ins for their own clients
CREATE POLICY "health_checkins_insert" ON public.health_checkins 
  FOR INSERT WITH CHECK (
    auth.uid() = coach_id
    AND EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id AND coach_id = auth.uid()
    )
  );

-- Coaches can update their own check-ins
CREATE POLICY "health_checkins_update" ON public.health_checkins 
  FOR UPDATE USING (auth.uid() = coach_id);

-- Coaches can delete their own check-ins
CREATE POLICY "health_checkins_delete" ON public.health_checkins 
  FOR DELETE USING (auth.uid() = coach_id);

-- Apply updated_at trigger
CREATE TRIGGER update_health_checkins_updated_at
  BEFORE UPDATE ON public.health_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for common queries
CREATE INDEX idx_health_checkins_client_id ON public.health_checkins(client_id);
CREATE INDEX idx_health_checkins_coach_id ON public.health_checkins(coach_id);
CREATE INDEX idx_health_checkins_week_of ON public.health_checkins(week_of DESC);
CREATE INDEX idx_health_checkins_scores ON public.health_checkins(current_score, predictive_score);
