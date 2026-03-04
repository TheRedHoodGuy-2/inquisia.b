-- Migration: Add similarity tracking columns to projects table
ALTER TABLE "public"."projects" 
ADD COLUMN IF NOT EXISTS "similar_project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "similarity_reason" TEXT;

ALTER TABLE "public"."project_versions"
ADD COLUMN IF NOT EXISTS "similar_project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "similarity_reason" TEXT;

ALTER TABLE "public"."change_requests"
ADD COLUMN IF NOT EXISTS "similar_project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "similarity_reason" TEXT;
