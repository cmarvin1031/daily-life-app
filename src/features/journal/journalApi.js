import { supabase } from '../../lib/supabaseClient.js';

export async function getJournalEntry(dateKey) {
  const { data, error } = await supabase.from('journal_entries').select('*').eq('date', dateKey).maybeSingle();
  if (error) throw error;
  return data; // null when no entry exists yet for this date
}

export async function saveJournalEntry(dateKey, body) {
  const { error } = await supabase
    .from('journal_entries')
    .upsert({ date: dateKey, body, updated_at: new Date().toISOString() }, { onConflict: 'user_id,date' });
  if (error) throw error;
}
