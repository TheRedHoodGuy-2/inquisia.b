-- Add parent_id for one-level threading and updated_at for edits
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL, -- " chat\, \assistant\, \summary\, \analysis\
 usage_count INTEGER DEFAULT 0,
 window_start TIMESTAMPTZ DEFAULT NOW(),
 UNIQUE(user_id, feature_type)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature ON ai_usage_stats(user_id, feature_type);
