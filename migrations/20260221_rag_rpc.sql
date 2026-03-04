-- INQUISIA PROJECT: RAG Vector Search Function
-- This function allows Elara to search within a single project for highly contextual answers.

BEGIN;

CREATE OR REPLACE FUNCTION search_project_context (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  target_project_id uuid
)
RETURNS TABLE (
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    project_embeddings.content,
    1 - (project_embeddings.embedding <=> query_embedding) AS similarity
  FROM project_embeddings
  WHERE 
    project_embeddings.project_id = target_project_id
    AND 1 - (project_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY project_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMIT;
