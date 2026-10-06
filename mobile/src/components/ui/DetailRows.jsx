/**
 * SectionTitle — titre de section gris uppercase
 * Utilisé dans les pages de détail (stock, équipements, interventions…)
 */
export function SectionTitle({ children }) {
  return (
    <p className="px-4 py-2 text-xs font-semibold text-[#616161] uppercase tracking-wide bg-[#F4F6F8]">
      {children}
    </p>
  )
}

/**
 * InfoRow — ligne label + valeur avec icône optionnelle
 * Retourne null si value est falsy (pas de rendu pour les champs vides).
 *
 * icon  : composant lucide-react
 * label : libellé à gauche
 * value : valeur à droite (string, number, ou ReactNode)
 */
export function InfoRow({ icon: Icon, label, value, children }) {
  if (!value && !children) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F0F0F0] last:border-0">
      {Icon && <Icon size={15} className="text-[#909090] mt-0.5 shrink-0" />}
      <span className="text-xs text-[#909090] w-28 shrink-0">{label}</span>
      {children
        ? <div className="flex-1">{children}</div>
        : <span className="text-sm text-[#2E2E2E] flex-1">{value}</span>
      }
    </div>
  )
}
