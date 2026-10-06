// ─── Spacing, Border Radius & Ombres TUNNEL GMAO ────────────────────────────
// Esthétique industrielle : légèrement arrondi, jamais "pill", pas d'ombres lourdes

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
}

export const borderRadius = {
  badge:        '3px',   // Badge / Tag
  button:       '4px',   // Bouton
  card:         '4px',   // Card
  input:        '6px',   // Input
  notification: '8px',   // Notification — max autorisé sur les conteneurs
}

export const shadows = {
  none:   'none',
  focus:  '0 0 0 3px rgba(31, 58, 95, 0.10)',
  card:   '0 1px 3px rgba(0, 0, 0, 0.08)',
  modal:  '0 4px 16px rgba(0, 0, 0, 0.15)',
}

export const transitions = {
  fast:    '100ms ease',
  default: '150ms ease',
  // Max recommandé : 200ms — feedback immédiat, pas d'animations superflues
}
