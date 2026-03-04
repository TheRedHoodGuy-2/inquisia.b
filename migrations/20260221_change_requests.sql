-- INQUISIA PROJECT: Change Requests Migration
-- Run this in the Supabase SQL Editor to create the missing table

BEGIN;

CREATE TABLE IF NOT EXISTS change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'withdrawn')),
  fields JSONB NOT NULL, -- Checklist of what to change
  reason TEXT NOT NULL,
  proposed_data JSONB NOT NULL, -- New metadata
  new_report_url TEXT,
  new_pdf_text TEXT,
  new_plagiarism_score INTEGER,
  supervisor_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_change_requests_project_id ON change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);

COMMIT;
