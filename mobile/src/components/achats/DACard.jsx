function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
}

const urgencyLabel = { high: 'Urgent', critical: 'Critique', normal: null }
const urgencyColor = { high: '#ef4444', critical: '#8b5cf6', normal: null }

export function DACard({ item }) {
  const urgency = item.urgency ?? 'normal'
  const status = item.derived_status

  return (
    <div className="bg-white border border-tunnel-border rounded-lg px-4 py-3 space-y-2">
      {/* Ligne 1 : label + statut */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-tunnel-text truncate">{item.item_label}</p>
          {item.stock_item_ref && (
            <span className="text-[11px] font-mono text-tunnel-muted">{item.stock_item_ref}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {status && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: status.color + '22', color: status.color }}
            >
              {status.label}
            </span>
          )}
          {urgencyLabel[urgency] && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: urgencyColor[urgency] + '22', color: urgencyColor[urgency] }}
            >
              {urgencyLabel[urgency]}
            </span>
          )}
        </div>
      </div>

      {/* Ligne 2 : quantité + intervention */}
      <div className="flex items-center gap-3 text-xs text-tunnel-muted">
        <span>{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
        {item.intervention_code && (
          <span className="font-mono truncate">{item.intervention_code}</span>
        )}
      </div>

      {/* Ligne 3 : demandeur + compteurs + date */}
      <div className="flex items-center justify-between text-[11px] text-tunnel-muted">
        <div className="flex items-center gap-2">
          {item.requester_name && <span>{item.requester_name}</span>}
          {item.suppliers_count > 0 && <span>{item.suppliers_count} fourn.</span>}
          {item.quotes_count > 0 && <span>{item.quotes_count} devis</span>}
        </div>
        <span>{timeAgo(item.created_at)}</span>
      </div>
    </div>
  )
}
