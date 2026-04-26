const TASKS_BADGE_STORAGE_KEY = 'tunnel_tasks_unassigned_todo_count';
const TASKS_BADGE_EVENT = 'tunnel:tasks-badge-updated';

export function getTasksSidebarBadgeCount() {
  const raw = localStorage.getItem(TASKS_BADGE_STORAGE_KEY);
  const parsed = Number.parseInt(raw ?? '0', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function setTasksSidebarBadgeCount(count) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  localStorage.setItem(TASKS_BADGE_STORAGE_KEY, String(safeCount));
  window.dispatchEvent(new CustomEvent(TASKS_BADGE_EVENT, { detail: { count: safeCount } }));
}

export const TASKS_BADGE = {
  key: TASKS_BADGE_STORAGE_KEY,
  event: TASKS_BADGE_EVENT,
};
