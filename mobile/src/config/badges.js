// ─── Mappings badges TUNNEL GMAO ────────────────────────────────────────────
// Source de vérité pour tous les composants Badge / StatusBadge / PriorityBadge

// ─── Statuts interventions ───────────────────────────────────────────────────
export const INTERVENTION_STATUSES = {
  ouvert:         { label: 'Ouvert',          color: '#1F3A5F', variant: 'info' },
  attente_pieces: { label: 'Attente pièces',  color: '#C62828', variant: 'danger' },
  attente_prod:   { label: 'Attente prod',    color: '#ED6C02', variant: 'warning' },
  ferme:          { label: 'Fermé',           color: '#2E7D32', variant: 'success' },

  // Alias API courants
  nouveau:        { label: 'Nouveau',         color: '#1F3A5F', variant: 'info' },
  new:            { label: 'Nouveau',         color: '#1F3A5F', variant: 'info' },
  en_cours:       { label: 'En cours',        color: '#ED6C02', variant: 'warning' },
  in_progress:    { label: 'En cours',        color: '#ED6C02', variant: 'warning' },
  termine:        { label: 'Terminé',         color: '#2E7D32', variant: 'success' },
  done:           { label: 'Terminé',         color: '#2E7D32', variant: 'success' },
  annule:         { label: 'Annulé',          color: '#616161', variant: 'secondary' },
  cancelled:      { label: 'Annulé',          color: '#616161', variant: 'secondary' },
}

// ─── Statuts tâches (intervention_tasks) ─────────────────────────────────────
// Harmonisé avec src/config/taskConfig.js côté tunnel-gmao (web) — mêmes
// libellés et même sémantique de couleur pour rester cohérent entre clients.
export const TASK_STATUSES = {
  todo:        { label: 'En attente', color: '#616161', variant: 'secondary' },
  in_progress: { label: 'En cours',   color: '#1F3A5F', variant: 'info' },
  done:        { label: 'Validée',    color: '#2E7D32', variant: 'success' },
  skipped:     { label: 'Ignorée',    color: '#ED6C02', variant: 'warning' },
}

// ─── Origine des tâches ────────────────────────────────────────────────────
export const TASK_ORIGINS = {
  plan: { label: 'Gamme',       color: '#2E7D32', variant: 'success' },
  resp: { label: 'Responsable', color: '#1F3A5F', variant: 'info' },
  tech: { label: 'Technicien',  color: '#ED6C02', variant: 'warning' },
}

// ─── Priorités ───────────────────────────────────────────────────────────────
export const PRIORITIES = {
  urgent:    { label: 'Urgent',    color: '#C62828', variant: 'danger' },
  haute:     { label: 'Haute',     color: '#ED6C02', variant: 'warning' },
  important: { label: 'Important', color: '#ED6C02', variant: 'warning' },
  normale:   { label: 'Normale',   color: '#1F3A5F', variant: 'info' },
  normal:    { label: 'Normale',   color: '#1F3A5F', variant: 'info' },
  basse:     { label: 'Basse',     color: '#616161', variant: 'secondary' },
  faible:    { label: 'Faible',    color: '#616161', variant: 'secondary' },
}

// ─── Types d'intervention ────────────────────────────────────────────────────
export const INTERVENTION_TYPES = {
  CUR: { label: 'Curatif',      color: '#ED6C02' },
  PRE: { label: 'Préventif',    color: '#1F3A5F' },
  REA: { label: 'Réajustement', color: '#2E7D32' },
  BAT: { label: 'Bâtiment',     color: '#616161' },
  PRO: { label: 'Projet',       color: '#1F3A5F' },
  COF: { label: 'Coffret',      color: '#616161' },
  PIL: { label: 'Pilote',       color: '#7B1FA2' },
  MES: { label: 'Mise en service', color: '#0288D1' },
}

// ─── États machine ───────────────────────────────────────────────────────────
export const MACHINE_STATES = {
  ok:          { label: 'OK',          color: '#2E7D32', variant: 'success' },
  maintenance: { label: 'Maintenance', color: '#1F3A5F', variant: 'info' },
  alerte:      { label: 'Alerte',      color: '#ED6C02', variant: 'warning' },
  critique:    { label: 'Critique',    color: '#C62828', variant: 'danger' },
}

// ─── Variants → classes Tailwind (utilisé par Badge.jsx) ────────────────────
export const BADGE_VARIANTS = {
  info:      { bg: 'bg-tunnel-primary/10', text: 'text-tunnel-primary',   border: 'border-tunnel-primary/20' },
  success:   { bg: 'bg-tunnel-success/10', text: 'text-tunnel-success',   border: 'border-tunnel-success/20' },
  warning:   { bg: 'bg-tunnel-warning/10', text: 'text-tunnel-warning',   border: 'border-tunnel-warning/20' },
  danger:    { bg: 'bg-tunnel-danger/10',  text: 'text-tunnel-danger',    border: 'border-tunnel-danger/20' },
  secondary: { bg: 'bg-gray-100',          text: 'text-tunnel-secondary', border: 'border-gray-200' },
}
