-- Run this in your Supabase SQL editor

-- Hackathons table
CREATE TABLE IF NOT EXISTS hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT NOT NULL,
  organizer TEXT,
  registration_deadline TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  prize_amount TEXT,
  tags TEXT[] DEFAULT '{}',
  mode TEXT DEFAULT 'online' CHECK (mode IN ('online', 'offline', 'hybrid')),
  location TEXT,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_url)  -- required for scraper upserts
);

-- User hackathon interactions
CREATE TABLE IF NOT EXISTS user_hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('registered', 'shortlisted')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, hackathon_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hackathons_source ON hackathons(source);
CREATE INDEX IF NOT EXISTS idx_hackathons_mode ON hackathons(mode);
CREATE INDEX IF NOT EXISTS idx_hackathons_start_date ON hackathons(start_date);
CREATE INDEX IF NOT EXISTS idx_user_hackathons_user_id ON user_hackathons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hackathons_status ON user_hackathons(status);

-- RLS Policies
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hackathons ENABLE ROW LEVEL SECURITY;

-- Anyone can read hackathons
CREATE POLICY "hackathons_public_read" ON hackathons FOR SELECT USING (true);

-- Only service role can insert/update hackathons
CREATE POLICY "hackathons_service_insert" ON hackathons FOR INSERT WITH CHECK (true);
CREATE POLICY "hackathons_service_update" ON hackathons FOR UPDATE USING (true);

-- Users can only read/write their own records
CREATE POLICY "user_hackathons_own_read" ON user_hackathons FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "user_hackathons_own_insert" ON user_hackathons FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "user_hackathons_own_update" ON user_hackathons FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "user_hackathons_own_delete" ON user_hackathons FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Sample hackathon data
INSERT INTO hackathons (title, description, image_url, source, source_url, organizer, registration_deadline, start_date, end_date, prize_amount, tags, mode, location, participants_count) VALUES
(
  'Global AI Hackathon 2025',
  'Build cutting-edge AI solutions that tackle real-world problems. Join thousands of developers, designers, and innovators from around the globe.',
  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800',
  'devpost',
  'https://devpost.com',
  'Devpost',
  NOW() + INTERVAL '15 days',
  NOW() + INTERVAL '20 days',
  NOW() + INTERVAL '22 days',
  '$50,000',
  ARRAY['AI', 'Machine Learning', 'Python', 'LLM'],
  'online',
  NULL,
  12500
),
(
  'Web3 Buildathon',
  'Create the future of decentralized applications. Explore blockchain, DeFi, NFTs, and the metaverse in this exciting hackathon.',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
  'devpost',
  'https://devpost.com',
  'ETH Global',
  NOW() + INTERVAL '8 days',
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '12 days',
  '$30,000',
  ARRAY['Web3', 'Blockchain', 'Solidity', 'DeFi'],
  'online',
  NULL,
  8200
),
(
  'HackMIT 2025',
  'MIT''s annual hackathon bringing together the brightest minds to solve tomorrow''s challenges. 36 hours of hacking in Cambridge.',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
  'mlh',
  'https://mlh.io',
  'MIT',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '45 days',
  NOW() + INTERVAL '47 days',
  '$25,000',
  ARRAY['Open Theme', 'Hardware', 'Software'],
  'offline',
  'Cambridge, MA, USA',
  3000
),
(
  'Climate Tech Challenge',
  'Hack for the planet! Build innovative solutions to address climate change, sustainability, and environmental challenges.',
  'https://images.unsplash.com/photo-1569163139394-de4e5f43e5ca?w=800',
  'hackerearth',
  'https://hackerearth.com',
  'GreenTech Foundation',
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '9 days',
  '$20,000',
  ARRAY['CleanTech', 'Sustainability', 'IoT', 'Data Science'],
  'hybrid',
  'San Francisco, CA',
  5600
),
(
  'HealthHack 2025',
  'Transform healthcare with technology. Build apps that improve patient outcomes, streamline medical processes, or enhance wellness.',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
  'devpost',
  'https://devpost.com',
  'HealthTech Alliance',
  NOW() + INTERVAL '20 days',
  NOW() + INTERVAL '25 days',
  NOW() + INTERVAL '27 days',
  '$15,000',
  ARRAY['HealthTech', 'ML', 'Mobile', 'Wearables'],
  'online',
  NULL,
  4100
),
(
  'Hack the Box CTF',
  'Test your cybersecurity skills in this intensive capture-the-flag competition. Penetration testing, reverse engineering, and more.',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
  'hackerearth',
  'https://hackerearth.com',
  'Hack the Box',
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '6 days',
  '$10,000',
  ARRAY['Cybersecurity', 'CTF', 'Networking'],
  'online',
  NULL,
  9800
),
(
  'Fintech Innovation Sprint',
  'Reimagine banking, payments, and financial services. Build the next generation of fintech products.',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
  'unstop',
  'https://unstop.com',
  'Visa & Stripe',
  NOW() + INTERVAL '12 days',
  NOW() + INTERVAL '18 days',
  NOW() + INTERVAL '20 days',
  '$40,000',
  ARRAY['Fintech', 'Payments', 'Banking', 'APIs'],
  'online',
  NULL,
  6700
),
(
  'GameDev Jam 2025',
  'Create amazing games in 72 hours! Any platform, any genre. Prizes for most innovative, best art, and most fun categories.',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
  'devpost',
  'https://devpost.com',
  'Unity Technologies',
  NOW() + INTERVAL '25 days',
  NOW() + INTERVAL '28 days',
  NOW() + INTERVAL '31 days',
  '$12,000',
  ARRAY['GameDev', 'Unity', 'Unreal', 'Creative'],
  'online',
  NULL,
  15000
);
