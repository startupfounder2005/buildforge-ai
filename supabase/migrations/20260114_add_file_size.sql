-- Add file_size column to documents table
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT 0;
