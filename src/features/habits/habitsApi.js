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

// Every logged date for a habit, all-time (feeds both the streak calc and
// the month history grid). Paged: a daily habit crosses Supabase's 1000-row
// response cap after ~2.7 years, and a truncated history would silently
// break streaks.
export async function getHabitLogDates(habitId) {
  const rows = await fetchAllRows(() =>
    supabase.from('habit_logs').select('date').eq('habit_id', habitId).order('date', { ascending: false }),
  );
  return rows.map((row) => row.date);
}

// All log dates for every habit, grouped by habit_id -- feeds the
// Dashboard's longest-streak stat and weekly chart without an N+1 query per
// habit. Paged for the same reason as above, and this one hits the cap much
// sooner (5 daily habits = ~7 months).
export async function getAllHabitLogsByHabit() {
  const rows = await fetchAllRows(() =>
    supabase
      .from('habit_logs')
      .select('habit_id, date')
      .order('date', { ascending: false })
      .order('habit_id', { ascending: true }),
  );
  const byHabit = {};
  for (const row of rows) {
    if (!byHabit[row.habit_id]) byHabit[row.habit_id] = [];
    byHabit[row.habit_id].push(row.date);
  }
  return byHabit;
}

export async function getHabitIdsLoggedOn(dateKey) {
  const { data, error } = await supabase.from('habit_logs').select('habit_id').eq('date', dateKey);
  if (error) throw error;
  return data.map((row) => row.habit_id);
}

export async function logHabitDay(habitId, dateKey) {
  const { error } = await supabase.from('habit_logs').insert({ habit_id: habitId, date: dateKey });
  if (error && error.code !== '23505') throw error; // already logged elsewhere; treat as success
}

export async function unlogHabitDay(habitId, dateKey) {
  const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', dateKey);
  if (error) throw error;
}
