/**
 * Card TUNNEL GMAO
 * Conteneur surface blanche, ombre légère, radius card (4px)
 */
export function Card({ children, style, className = '' }) {
  return (
    <div className={`bg-tunnel-surface rounded-card shadow-card border border-tunnel-border ${className}`} style={style}>
      {children}
    </div>
  )
}
