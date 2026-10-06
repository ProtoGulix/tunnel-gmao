import { DACard } from './DACard'
import { Loader2 } from 'lucide-react'

export function DAList({ items, loading, error }) {
  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 size={24} className="animate-spin text-tunnel-muted" />
    </div>
  )

  if (error) return (
    <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
      {error}
    </div>
  )

  if (!items.length) return (
    <div className="text-center py-12 text-sm text-tunnel-muted">
      Aucune demande d'achat
    </div>
  )

  return (
    <div className="space-y-2 p-4">
      {items.map(item => (
        <DACard key={item.id} item={item} />
      ))}
    </div>
  )
}
