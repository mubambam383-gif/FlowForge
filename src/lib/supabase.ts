import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local and in Vercel.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper types derived from database schema could be added here or in a separate types file
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WebhookEvent = {
  id: string;
  user_id: string;
  payload: any;
  received_at: string;
  source: string | null;
};
