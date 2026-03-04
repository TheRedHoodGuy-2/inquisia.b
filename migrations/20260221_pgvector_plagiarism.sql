-- INQUISIA PROJECT: Vector Embeddings Migration
-- Run this in the Supabase SQL Editor to enable pgvector and create the embeddings table

BEGIN;

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the table for project document chunks and their vectors
CREATE TABLE IF NOT EXISTS project_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768) NOT NULL, -- 768 dimensions for Google Gemini text-embedding-004
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index the project_id to quickly delete or fetch chunks for a specific project
CREATE INDEX IF NOT EXISTS idx_project_embeddings_project_id ON project_embeddings(project_id);

-- Create a vector index using HNSW for fast similarity search across the entire platform
CREATE INDEX IF NOT EXISTS idx_project_embeddings_vector ON project_embeddings USING hnsw (embedding vector_cosine_ops);

-- Setup an RPC function so we can easily call the vector search from the client securely
CREATE OR REPLACE FUNCTION match_project_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  exclude_project_id uuid
)
RETURNS TABLE (
  project_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    project_embeddings.project_id,
    project_embeddings.content,
    1 - (project_embeddings.embedding <=> query_embedding) AS similarity
  FROM project_embeddings
  WHERE 
    project_embeddings.project_id != exclude_project_id
    AND 1 - (project_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY project_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMIT;
