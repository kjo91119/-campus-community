import { getSupabaseClient } from '@/lib/supabase/client';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

export function postsQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.posts);
}
