/**
 * DynBadge — badge coloré dynamiquement (couleur hex en prop)
 * Remplace les <span style={{ backgroundColor: color+'22', color }}> inline partout dans l'app.
 *
 * color   : couleur hex (ex: '#C62828')
 * size    : 'xs' | 'sm' (défaut: 'xs')
 * mono    : police monospace (défaut: false)
 */
export function DynBadge({ children, color = '#616161', size = 'xs', mono = false, className = '' }) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-[10px]'
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${textSize} ${mono ? 'font-mono' : ''} ${className}`}
      style={{ backgroundColor: color + '22', color }}
    >
      {children}
    </span>
  )
}
