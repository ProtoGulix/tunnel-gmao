import { BADGE_VARIANTS } from '../../config/badges'

/**
 * Badge TUNNEL GMAO
 * variant: 'info' | 'success' | 'warning' | 'danger' | 'secondary'
 */
export function Badge({ children, variant = 'secondary', mono = false, className = '' }) {
  const v = BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.secondary
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-badge border text-badge font-medium
      ${v.bg} ${v.text} ${v.border}
      ${mono ? 'font-mono' : ''}
      ${className}
    `.trim()}>
      {children}
    </span>
  )
}
