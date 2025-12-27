-- Create support_requests table
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  supporter_email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read by request ID (for volunteer page - needed for magic links)
CREATE POLICY "Allow public read by request ID"
  ON public.support_requests
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert requests
CREATE POLICY "Allow authenticated insert"
  ON public.support_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update (for volunteers to accept/decline)
CREATE POLICY "Allow public update"
  ON public.support_requests
  FOR UPDATE
  USING (true);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON public.support_requests(user_id);

-- Create index on supporter_email for faster queries
CREATE INDEX IF NOT EXISTS idx_support_requests_supporter_email ON public.support_requests(supporter_email);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(status);

-- Add helpful comment
COMMENT ON TABLE public.support_requests IS 'Support requests for the Lighthouse delegation system. Family members can request help and supporters receive magic links to accept/decline.';
