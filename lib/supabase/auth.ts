import { getSupabaseClient } from '@/lib/supabase/client';

export function getSupabaseAuth() {
  return getSupabaseClient().auth;
}
