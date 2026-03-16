import { getSupabaseClient } from '@/lib/supabase/client';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

export function commentsQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.comments);
}
