import { supabase } from '../../lib/supabaseClient.js';

export async function getGoals(statuses) {
  let query = supabase.from('goals').select('*').order('position', { ascending: true });
  if (statuses) query = query.in('status', statuses);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addGoal(title, position, { category, goalType, counterTarget } = {}) {
  const { error } = await supabase.from('goals').insert({
    title: title.trim(),
    position,
    category,
    goal_type: goalType,
    counter_target: goalType === 'counter' ? counterTarget : null,
  });
  if (error) throw error;
}

export async function updateGoal(id, fields) {
  const { error } = await supabase
    .from('goals')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteGoal(id) {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

// Task counts for a batch of goals in one query, used by the list view's
// "N of M tasks done" line without a per-card round trip.
export async function getTaskCountsForGoals(goalIds) {
  if (goalIds.length === 0) return {};
  const { data, error } = await supabase.from('goal_tasks').select('goal_id, done').in('goal_id', goalIds);
  if (error) throw error;
  const counts = {};
  for (const row of data) {
    if (!counts[row.goal_id]) counts[row.goal_id] = { done: 0, total: 0 };
    counts[row.goal_id].total += 1;
    if (row.done) counts[row.goal_id].done += 1;
  }
  return counts;
}

// ── Tasks ───────────────────────────────────────────────────────────────

export async function getGoalTasks(goalId) {
  const { data, error } = await supabase
    .from('goal_tasks')
    .select('*')
    .eq('goal_id', goalId)
    .order('done', { ascending: true })
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addGoalTask(goalId, text, position) {
  const { error } = await supabase.from('goal_tasks').insert({ goal_id: goalId, text: text.trim(), position });
  if (error) throw error;
}

export async function updateGoalTask(id, fields) {
  const { error } = await supabase.from('goal_tasks').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteGoalTask(id) {
  const { error } = await supabase.from('goal_tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderGoalTasks(orderedItems) {
  const changed = orderedItems.filter((item, index) => item.position !== index);
  await Promise.all(changed.map((item) => updateGoalTask(item.id, { position: orderedItems.indexOf(item) })));
}
