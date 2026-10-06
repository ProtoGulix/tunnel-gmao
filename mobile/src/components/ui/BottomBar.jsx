import { Loader2 } from 'lucide-react'

// ─── Styles des variantes de boutons ─────────────────────────────────────────
const variantCls = {
  primary:   'flex-1 py-2.5 rounded-lg bg-tunnel-accent text-white text-sm font-semibold disabled:opacity-50 active:opacity-90 flex items-center justify-center gap-2',
  secondary: 'flex-1 py-2.5 rounded-lg border border-tunnel-border text-sm font-medium text-tunnel-muted bg-white active:bg-tunnel-bg flex items-center justify-center gap-2',
  danger:    'flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold active:bg-red-600 flex items-center justify-center gap-2',
}

/**
 * Barre d'action fixe en bas d'un écran ou d'un formulaire.
 * Gère le padding safe-area iOS et le border-top cohérent.
 *
 * @param {boolean} safeBottom  — ajoute le padding safe-area (défaut: false)
 */
export function BottomBar({ children, safeBottom = false, className = '' }) {
  return (
    <div className={`shrink-0 flex gap-3 px-4 py-3 border-t border-tunnel-border bg-white${safeBottom ? ' safe-bottom' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

/**
 * Bouton d'action standardisé pour BottomBar.
 *
 * @param {'primary'|'secondary'|'danger'} variant
 * @param {boolean}  loading  — remplace l'icône par un spinner
 * @param {ReactNode} icon    — icône affichée à gauche du texte
 */
export function BottomBtn({ variant = 'primary', children, loading = false, icon, className = '', ...props }) {
  return (
    <button className={`${variantCls[variant]}${className ? ` ${className}` : ''}`} {...props}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
