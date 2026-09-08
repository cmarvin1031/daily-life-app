import { supabase } from '../../lib/supabaseClient.js';

export async function getNotebooks() {
  const { data, error } = await supabase.from('notebooks').select('*').order('position', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addNotebook(title, position) {
  const { error } = await supabase.from('notebooks').insert({ title: title.trim(), position });
  if (error) throw error;
}

export async function updateNotebook(id, fields) {
  const { error } = await supabase.from('notebooks').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteNotebook(id) {
  const { error } = await supabase.from('notebooks').delete().eq('id', id);
  if (error) throw error;
}
