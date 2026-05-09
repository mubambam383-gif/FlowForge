import { createClient } from '@supabase/supabase-js';

let adminClient: any = null;

export function getSupabaseAdmin(): any | null {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }) as any;
  }

  return adminClient;
}

export function requireSupabaseAdmin(res: any) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    res.status(500).json({
      error: 'Supabase server credentials are not configured.',
      required: ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    });
    return null;
  }

  return supabase;
}
