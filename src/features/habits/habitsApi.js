import { fetchAllRows, supabase } from '../../lib/supabaseClient.js';

export async function getHabits({ archived = false } = {}) {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('archived', archived)
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addHabit(name, position) {
  const { error } = await supabase.from('habits').insert({ name: name.trim(), position });
  if (error) throw error;
}

export async function updateHabit(id, fields) {
  const { error } = await supabase.from('habits').update(fields).eq('id', id);
  if (error) throw error;
}

export async function archiveHabit(id) {
  const { error } = await supabase.from('habits').update({ archived: true }).eq('id', id);
  if (error) throw error;
}

export async function restoreHabit(id) {
  const { error } = await supabase.from('habits').update({ archived: false }).eq('id', id);
  if (error) throw error;
}

export async function deleteHabitPermanently(id) {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}

// Every log for a habit, all-time, as [{ date, value }] (see habitProgress.js
// for what `value` means). Paged: a daily habit crosses Supabase's 1000-row
// response cap after ~2.7 years, and a truncated history would silently
// break streaks.
export async function getHabitLogs(habitId) {
  return fetchAllRows(() =>
    supabase.from('habit_logs').select('date, value').eq('habit_id', habitId).order('date', { ascending: false }),
  );
}

// All logs for every habit, grouped by habit_id -- feeds the Dashboard's
// streaks and week dots without an N+1 query per habit. Paged for the same
// reason as above, and this one hits the cap much sooner.
export async function getAllHabitLogsByHabit() {
  const rows = await fetchAllRows(() =>
    supabase
      .from('habit_logs')
      .select('habit_id, date, value')
      .order('date', { ascending: false })
      .order('habit_id', { ascending: true }),
  );
  const byHabit = {};
  for (const row of rows) {
    if (!byHabit[row.habit_id]) byHabit[row.habit_id] = [];
    byHabit[row.habit_id].push({ date: row.date, value: row.value });
  }
  return byHabit;
}

// { [habitId]: value } for every habit logged on the date.
export async function getLogsForDate(dateKey) {
  const { data, error } = await supabase.from('habit_logs').select('habit_id, value').eq('date', dateKey);
  if (error) throw error;
  const byHabit = {};
  for (const row of data) byHabit[row.habit_id] = row.value;
  return byHabit;
}

// Creates or replaces the day's log. value: null for a plain check, a
// number for a quantity habit.
export async function setHabitLog(habitId, dateKey, value = null) {
  const { error } = await supabase
    .from('habit_logs')
    .upsert({ habit_id: habitId, date: dateKey, value }, { onConflict: 'habit_id,date' });
  if (error) throw error;
}

export async function unlogHabitDay(habitId, dateKey) {
  const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', dateKey);
  if (error) throw error;
}
