import { AlertCircle } from 'lucide-react'

/**
 * CriticalAlert TUNNEL GMAO
 * Alerte rouge pour les états bloquants (critique, bloqué, annulé)
 */
export function CriticalAlert({ message }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-notif border border-tunnel-danger/30 bg-tunnel-danger/10">
      <AlertCircle size={16} className="text-tunnel-danger mt-0.5 shrink-0" strokeWidth={2} />
      <p className="text-sm text-tunnel-danger font-medium">{message}</p>
    </div>
  )
}
