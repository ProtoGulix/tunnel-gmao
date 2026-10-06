// ─── Tokens couleurs TUNNEL GMAO ────────────────────────────────────────────

export const colors = {
  // Base
  primary:        '#1F3A5F',
  textPrimary:    '#2E2E2E',
  background:     '#F4F6F8',
  surface:        '#FFFFFF',
  textSecondary:  '#616161',
  border:         '#E0E0E0',
  divider:        '#BDBDBD',

  // Sémantiques
  success:  '#2E7D32',
  warning:  '#ED6C02',
  danger:   '#C62828',
  info:     '#1F3A5F',

  // Sidebar (dark)
  sidebarBg:     '#2E2E2E',
  sidebarText:   '#E5E9EF',
  sidebarMuted:  '#A0A8B5',
  sidebarHover:  'rgba(255,255,255,0.10)',
  sidebarActive: '#3B4F70',
  sidebarBorder: 'rgba(255,255,255,0.08)',
}

// ─── Mapping statuts interventions ──────────────────────────────────────────
export const statusColors = {
  'ouvert':         '#1F3A5F',
  'attente_pieces': '#C62828',
  'attente_prod':   '#ED6C02',
  'ferme':          '#2E7D32',
}

// ─── Mapping priorités ───────────────────────────────────────────────────────
export const priorityColors = {
  urgent:  '#C62828',
  haute:   '#ED6C02',
  normale: '#1F3A5F',
  basse:   '#616161',
}

// ─── Mapping états machine ───────────────────────────────────────────────────
export const machineStateColors = {
  ok:          '#2E7D32',
  maintenance: '#1F3A5F',
  alerte:      '#ED6C02',
  critique:    '#C62828',
}
