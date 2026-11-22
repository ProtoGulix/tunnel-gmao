export const TASK_STATUS_LABEL = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminée',
  skipped: 'Annulée',
};

export const TASK_STATUS_COLOR = {
  todo: 'gray',
  in_progress: 'blue',
  done: 'green',
  skipped: 'orange',
};

export const TASK_ORIGIN_LABEL = {
  plan: 'Gamme',
  resp: 'Resp',
  tech: 'Tech',
};

export const TASK_ORIGIN_COLOR = {
  plan: 'green',
  resp: 'blue',
  tech: 'orange',
};

// Barre de couleur à gauche d'une ligne de tâche, selon le statut
export const TASK_ACCENT = {
  todo: 'var(--gray-6)',
  in_progress: 'var(--blue-9)',
  done: 'var(--green-8)',
  skipped: 'var(--orange-8)',
};
