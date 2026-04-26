import { CheckSquare } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'tasks',
  path: '/tasks',
  label: 'Taches',
  icon: CheckSquare,
  pageTitle: 'Taches',
  pageSubtitle: 'Pilotage des taches intervention',
  section: 'maintenance',
  requiresAuth: true,
  public: false,
  order: 15,
  badgeStorageKey: 'tunnel_tasks_unassigned_todo_count',
};
