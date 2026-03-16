import { getSupabaseClient } from '@/lib/supabase/client';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

export function recruitmentsQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.recruitments);
}
