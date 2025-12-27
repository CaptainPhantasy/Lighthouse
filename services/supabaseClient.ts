import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (uses anon key)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for support requests
export interface SupportRequest {
  id?: string;
  user_id: string;
  supporter_email: string;
  request_type: string;
  status?: 'pending' | 'fulfilled' | 'declined';
  created_at?: string;
  fulfilled_at?: string;
}

// Table name for support requests
export const SUPPORT_REQUESTS_TABLE = 'support_requests';
