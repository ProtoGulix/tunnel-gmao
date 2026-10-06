import { Loader2 } from 'lucide-react'

/**
 * ListStatus — gère les trois états d'une liste : chargement, erreur, vide
 * Retourne null si les données sont prêtes et non vides (la liste s'affiche normalement).
 *
 * emptyMessage : string | (search) => string  — message ou fonction recevant le search courant
 */
export function ListStatus({ loading, error, empty, emptyMessage = 'Aucun élément', search = '' }) {
  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 size={20} className="animate-spin text-[#616161]" />
    </div>
  )

  if (error) return (
    <div className="m-4 p-3 rounded border border-[#C62828]/20 bg-[#C62828]/10 text-sm text-[#C62828]">
      {error}
    </div>
  )

  if (empty) return (
    <p className="text-center text-sm text-[#616161] py-16">
      {typeof emptyMessage === 'function' ? emptyMessage(search) : emptyMessage}
    </p>
  )

  return null
}
