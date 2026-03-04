-- INQUISIA PROJECT: Verification Tokens Migration
-- Run this in the Supabase SQL Editor to create the OTP table

BEGIN;

CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);

-- Update all existing students and public users to be marked as verified so they aren't locked out immediately
-- (They were implicitly verified before, so we keep that true for legacy accounts)
UPDATE users SET is_verified = true WHERE role IN ('student', 'public');

COMMIT;
