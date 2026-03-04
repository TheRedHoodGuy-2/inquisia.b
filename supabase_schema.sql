-- Phase 1: Foundation & Database
-- INQUISIA PROJECT DEFINITIVE DATABASE SCHEMA
-- RUN THIS ENTIRE SCRIPT IN THE SUPABASE SQL EDITOR

BEGIN;

-- DEPARTMENTS
CREATE TABLE departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  school TEXT NOT NULL DEFAULT 'School of Computing and Engineering Sciences',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI CATEGORIES (admin-managed list the AI chooses from)
CREATE TABLE ai_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USERS (single table, all roles)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'supervisor', 'admin', 'public')),
  full_name TEXT,
  display_name TEXT,
  bio TEXT,
  links JSONB DEFAULT '[]'::JSONB,
  matric_no TEXT,
  staff_id TEXT,
  degrees TEXT,
  level TEXT,
  department_id UUID REFERENCES departments(id),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'warned', 'restricted', 'banned')),
  status_reason TEXT,
  status_set_by UUID REFERENCES users(id),
  status_set_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSIONS (custom auth)
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  pdf_text TEXT,
  report_url TEXT NOT NULL,
  github_url TEXT,
  live_url TEXT,
  presentation_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested', 'rejected')),
  plagiarism_score INTEGER DEFAULT 0,
  plagiarism_flagged BOOLEAN DEFAULT FALSE,
  ai_category TEXT,
  student_tags TEXT[] DEFAULT '{}',
  ai_tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_limitations TEXT,
  downloads INTEGER DEFAULT 0,
  year INTEGER NOT NULL,
  department_id UUID REFERENCES departments(id),
  supervisor_id UUID NOT NULL REFERENCES users(id),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  supervisor_feedback TEXT,
  version INTEGER DEFAULT 1,
  parent_project_id UUID REFERENCES projects(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT AUTHORS (group credit)
CREATE TABLE project_authors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  role_description TEXT,
  UNIQUE(project_id, student_id)
);

-- PROJECT VERSIONS (history log)
CREATE TABLE project_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  report_url TEXT NOT NULL,
  plagiarism_score INTEGER DEFAULT 0,
  supervisor_feedback TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMENTS
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHANGE REQUESTS (for approved projects)
CREATE TABLE change_requests (
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

-- INDEXES
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_supervisor_id ON projects(supervisor_id);
CREATE INDEX idx_projects_uploaded_by ON projects(uploaded_by);
CREATE INDEX idx_projects_department_id ON projects(department_id);
CREATE INDEX idx_projects_ai_category ON projects(ai_category);
CREATE INDEX idx_project_authors_project_id ON project_authors(project_id);
CREATE INDEX idx_project_authors_student_id ON project_authors(student_id);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_change_requests_project_id ON change_requests(project_id);
CREATE INDEX idx_change_requests_status ON change_requests(status);

-- SEED: DEPARTMENTS
INSERT INTO departments (name) VALUES
  ('Computer Science'),
  ('Computer Information Systems'),
  ('Computer Technology'),
  ('Software Engineering'),
  ('Information Technology');

-- SEED: AI CATEGORIES
INSERT INTO ai_categories (name) VALUES
  ('Artificial Intelligence'),
  ('Machine Learning'),
  ('Cybersecurity'),
  ('Web Development'),
  ('Mobile Development'),
  ('Internet of Things'),
  ('Database Systems'),
  ('Computer Networks'),
  ('Software Engineering'),
  ('Human-Computer Interaction'),
  ('Data Science'),
  ('Computer Vision'),
  ('Natural Language Processing'),
  ('Cloud Computing'),
  ('Blockchain');

-- SEED: ADMIN USER
-- Password is: TestPass123!
INSERT INTO users (email, password_hash, role, full_name, display_name, is_verified, is_active)
VALUES (
  'admin@inquisia.babcock.edu.ng',
  '$2a$12$K1T3i9Zf1lq.3lK.8/w1K.S7oIf2bQjK6Z8gQ5.6.C5.101',
  'admin',
  'Inquisia Administrator',
  'Admin',
  TRUE,
  TRUE
);

COMMIT;
