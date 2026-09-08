import { supabase } from '../../lib/supabaseClient.js';
import { toDateKey } from '../../lib/dateUtils.js';

// Marks `dateKey` as opened. If this is the first time it's been opened,
// rolls forward incomplete todos from the most recent prior opened date.
// Safe to call repeatedly / from multiple devices: the day_state unique
// constraint means only the first caller performs the rollover.
//
// Dates beyond today are skipped entirely (no day_state row, no rollover):
// otherwise, just previewing a future date with the "next day" arrow would
// permanently lock in a snapshot of today's still-incomplete todos, and
// finishing them today would have no way to reach back and remove the
// copies already made. Rollover only makes sense once a day actually
// arrives, not when it's being looked at ahead of time.
export async function ensureDay(dateKey) {
  if (dateKey > toDateKey(new Date())) return;

  const { error: insertError } = await supabase.from('day_state').insert({ date: dateKey });

  if (insertError) {
    if (insertError.code === '23505') return; // already initialized elsewhere
    throw insertError;
  }

  const { data: priorState, error: priorError } = await supabase
    .from('day_state')
    .select('date')
    .lt('date', dateKey)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (priorError) throw priorError;
  if (!priorState) return;

  const { data: priorTodos, error: todosError } = await supabase
    .from('todos')
    .select('text, position')
    .eq('date', priorState.date)
    .eq('done', false)
    .order('position', { ascending: true });
  if (todosError) throw todosError;
  if (!priorTodos || priorTodos.length === 0) return;

  const rows = priorTodos.map((t, i) => ({ date: dateKey, text: t.text, position: i }));
  const { error: rollError } = await supabase.from('todos').insert(rows);
  if (rollError) throw rollError;
}

// ── Schedule ────────────────────────────────────────────────────────────

export async function getSchedule(dateKey) {
  const { data, error } = await supabase
    .from('schedule_entries')
    .select('hour, text')
    .eq('date', dateKey);
  if (error) throw error;
  const byHour = {};
  for (const row of data) byHour[row.hour] = row.text;
  return byHour;
}

export async function setScheduleHour(dateKey, hour, text) {
  if (text.trim() === '') {
    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('date', dateKey)
      .eq('hour', hour);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('schedule_entries')
    .upsert({ date: dateKey, hour, text }, { onConflict: 'user_id,date,hour' });
  if (error) throw error;
}

// ── Todos ───────────────────────────────────────────────────────────────

export async function getTodos(dateKey) {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('date', dateKey)
    .order('done', { ascending: true })
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addTodo(dateKey, text, position) {
  const { error } = await supabase.from('todos').insert({ date: dateKey, text: text.trim(), position });
  if (error) throw error;
}

export async function updateTodo(id, fields) {
  const { error } = await supabase.from('todos').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteTodo(id) {
  const { error } = await supabase.from('todos').delete().eq('id', id);
  if (error) throw error;
}

// Persists a new order for the full list: writes position = index for every
// item whose position actually changed.
export async function reorderTodos(orderedItems) {
  const changed = orderedItems.filter((item, index) => item.position !== index);
  await Promise.all(changed.map((item) => updateTodo(item.id, { position: orderedItems.indexOf(item) })));
}

// ── Priorities ──────────────────────────────────────────────────────────

export async function getPriorities(scope, periodKey) {
  const { data, error } = await supabase
    .from('priorities')
    .select('*')
    .eq('scope', scope)
    .eq('period_key', periodKey)
    .order('done', { ascending: true })
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addPriority(scope, periodKey, text, position) {
  const { error } = await supabase
    .from('priorities')
    .insert({ scope, period_key: periodKey, text: text.trim(), position });
  if (error) throw error;
}

export async function updatePriority(id, fields) {
  const { error } = await supabase.from('priorities').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deletePriority(id) {
  const { error } = await supabase.from('priorities').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderPriorities(orderedItems) {
  const changed = orderedItems.filter((item, index) => item.position !== index);
  await Promise.all(changed.map((item) => updatePriority(item.id, { position: orderedItems.indexOf(item) })));
}
