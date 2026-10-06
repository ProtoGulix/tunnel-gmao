import { DICard } from './DICard'
import { Loader2 } from 'lucide-react'

export function DIList({ items, loading, error, onSelect }) {
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
      Aucune demande
    </div>
  )

  return (
    <div className="divide-y divide-[#E0E0E0]">
      {items.map(item => (
        <DICard key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  )
}
