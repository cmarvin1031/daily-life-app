import { supabase } from '../../lib/supabaseClient.js';

export async function getNotes(notebookId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('notebook_id', notebookId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

// Page counts for a batch of notebooks in one query, for the notebook list's
// "N pages" line without a per-card round trip.
export async function getNoteCounts(notebookIds) {
  if (notebookIds.length === 0) return {};
  const { data, error } = await supabase.from('notes').select('notebook_id').in('notebook_id', notebookIds);
  if (error) throw error;
  const counts = {};
  for (const row of data) counts[row.notebook_id] = (counts[row.notebook_id] || 0) + 1;
  return counts;
}

export async function addNote(notebookId, title, position) {
  const { error } = await supabase.from('notes').insert({ notebook_id: notebookId, title: title.trim(), position });
  if (error) throw error;
}

export async function updateNote(id, fields) {
  const { error } = await supabase
    .from('notes')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}
