-- Fix user_id column to be text instead of UUID
-- This allows us to use user identifiers like "user-john-doe"

-- Drop the existing index first
DROP INDEX IF EXISTS public.idx_support_requests_user_id;

-- Alter the column to be text
ALTER TABLE public.support_requests ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON public.support_requests(user_id);
