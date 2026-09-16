import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill them in.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PostgREST caps every response at 1000 rows (Supabase's default max-rows),
// and does so silently -- a query over an unbounded history just comes back
// short. Anything reading a growing table has to page. `build()` must return
// a fresh query each call (builders are mutable) that includes an .order()
// so successive ranges are stable.
export async function fetchAllRows(build, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}
