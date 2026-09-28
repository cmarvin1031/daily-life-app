import { supabase } from './supabaseClient.js';

// Persists a new order for a list: writes position = index for every row
// whose position actually changed. Only touches `position`, so it doesn't
// bump columns like updated_at.
export async function reorderRows(table, orderedItems) {
  const changed = orderedItems.map((item, index) => ({ item, index })).filter(({ item, index }) => item.position !== index);
  const results = await Promise.all(
    changed.map(({ item, index }) => supabase.from(table).update({ position: index }).eq('id', item.id)),
  );
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
}
