-- RUN THIS IN SUPABASE SQL EDITOR
-- 1. Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Create a match function for semantic search across projects
CREATE OR REPLACE FUNCTION match_projects (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  abstract TEXT,
  ai_category TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    projects.id,
    projects.title,
    projects.abstract,
    projects.ai_category,
    1 - (projects.embedding <=> query_embedding) AS similarity
  FROM projects
  WHERE 1 - (projects.embedding <=> query_embedding) > match_threshold
    AND projects.status = 'approved'
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS projects_embedding_idx ON projects USING hnsw (embedding vector_cosine_ops);
