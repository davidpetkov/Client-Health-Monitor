-- 005_seed_test_data.sql
-- Seed test users and clients for development
-- NOTE: Run this AFTER creating test users in Supabase Auth

-- This script assumes you have created the following test users via Supabase Auth:
-- 1. coach@test.com (coach role) - Copy their UUID below
-- 2. leadership@test.com (leadership role) - Copy their UUID below

-- IMPORTANT: Replace these UUIDs with actual user IDs from auth.users after signup
-- You can find these by running: SELECT id, email FROM auth.users;

-- Example seed data (uncomment and update UUIDs after creating auth users):

-- Insert test clients for the coach
INSERT INTO public.clients (name, industry, coach_id) VALUES
  ('Acme Corporation', 'Technology', '6fbf3ffa-c666-4323-8a1b-aeb0757798ee'),
  ('Global Industries', 'Manufacturing', '6fbf3ffa-c666-4323-8a1b-aeb0757798ee'),
  ('Startup Labs', 'SaaS', '6fbf3ffa-c666-4323-8a1b-aeb0757798ee'),
  ('Enterprise Co', 'Finance', '6fbf3ffa-c666-4323-8a1b-aeb0757798ee'),
  ('Innovation Inc', 'Healthcare', '6fbf3ffa-c666-4323-8a1b-aeb0757798ee'),
  ('Digital Solutions', 'E-commerce', '6fbf3ffa-c666-4323-8a1b-aeb0757798ee'),
  ('Cloud Partners', 'Cloud Services', '6fbf3ffa-c666-4323-8a1b-aeb0757798ee'),
  ('Data Systems', 'Analytics', '6fbf3ffa-c666-4323-8a1b-aeb0757798ee');

-- Insert some historical check-ins (last 4 weeks)
-- Week 1 (4 weeks ago)
INSERT INTO public.health_checkins (client_id, coach_id, week_of, current_score, predictive_score, notes, action_items)
SELECT 
  c.id,
  c.coach_id,
  CURRENT_DATE - INTERVAL '28 days',
  4,
  4,
  'Good progress on deliverables',
  NULL
FROM public.clients c
WHERE c.name = 'Acme Corporation';

-- Add more historical data as needed...

-- For now, we'll seed data via the application after user creation
SELECT 'Seed script ready - create auth users first, then uncomment and run with actual UUIDs' as status;
