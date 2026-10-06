/**
 * EmptyState TUNNEL GMAO
 * Toujours indiquer explicitement l'état vide — jamais de liste silencieuse
 * icon : composant lucide-react optionnel
 */
export function EmptyState({ message, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
      {Icon && <Icon size={32} strokeWidth={1.5} className="text-tunnel-divider" />}
      <p className="text-sm text-tunnel-secondary">{message}</p>
    </div>
  )
}
