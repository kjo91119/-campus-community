import { getSupabaseClient } from '@/lib/supabase/client';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

export function boardsQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.boards);
}
