-- Run this in your Supabase SQL editor AFTER the initial schema

-- Manually tracked hackathons from external platforms
CREATE TABLE IF NOT EXISTS user_tracked_hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  organizer TEXT,
  platform TEXT DEFAULT 'other',
  registration_deadline TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  prize_amount TEXT,
  mode TEXT DEFAULT 'online' CHECK (mode IN ('online', 'offline', 'hybrid')),
  location TEXT,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  image_url TEXT,
  application_status TEXT NOT NULL DEFAULT 'applied'
    CHECK (application_status IN ('shortlisted', 'applied', 'org_shortlisted', 'accepted', 'rejected')),
  chat_links JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add chat_links column to existing user_hackathons
ALTER TABLE user_hackathons
  ADD COLUMN IF NOT EXISTS chat_links JSONB NOT NULL DEFAULT '[]';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_tracked_user_id ON user_tracked_hackathons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tracked_status  ON user_tracked_hackathons(application_status);

-- RLS
ALTER TABLE user_tracked_hackathons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tracked_own_read"   ON user_tracked_hackathons FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "user_tracked_own_insert" ON user_tracked_hackathons FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "user_tracked_own_update" ON user_tracked_hackathons FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "user_tracked_own_delete" ON user_tracked_hackathons FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
