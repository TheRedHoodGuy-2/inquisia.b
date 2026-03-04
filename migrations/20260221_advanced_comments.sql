-- PHASE 7 ADDENDUM: ADVANCED COMMENTS & AI USAGE
BEGIN;

-- 1. Update comments table for threading and edits
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL, -- 'chat', 'assistant', 'summary', 'analysis'
    usage_count INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature_type)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature ON ai_usage_stats(user_id, feature_type);

-- 3. RPC for atomic increment
CREATE OR REPLACE FUNCTION increment_ai_usage(row_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE ai_usage_stats
    SET usage_count = usage_count + 1
    WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
