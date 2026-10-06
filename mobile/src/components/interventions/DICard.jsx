import { ChevronRight } from 'lucide-react'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
}

export function DICard({ item, onSelect }) {
  const eq = item.equipement
  const borderColor = item.statut_color ?? '#6B7280'

  const content = (
    <div className="flex overflow-hidden w-full text-left bg-white active:opacity-75 transition-opacity"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.07)' }}>
      {/* Bordure gauche statut */}
      <div className="w-1 shrink-0" style={{ backgroundColor: borderColor }} />

      <div className="flex-1 min-w-0 px-3 py-2.5 space-y-1.5">
        {/* Ligne 1 — code DI + statut */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.code && (
            <span className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#1F3A5F18', color: '#1F3A5F' }}>
              {item.code}
            </span>
          )}
          {item.statut_color && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: borderColor + '22', color: borderColor }}>
              {item.statut_label}
            </span>
          )}
          {item.intervention_id && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: '#10B98122', color: '#10B981' }}>
              Intervention liée
            </span>
          )}
          <div className="flex-1" />
          <span className="text-[11px] text-[#616161]">{timeAgo(item.created_at)}</span>
          {onSelect && <ChevronRight size={13} className="text-[#BDBDBD] shrink-0" />}
        </div>

        {/* Ligne 2 — description */}
        <p className="text-sm font-medium text-[#2E2E2E] leading-snug line-clamp-2">{item.description ?? '—'}</p>

        {/* Ligne 3 — équipement + demandeur */}
        <div className="flex items-center gap-2 flex-wrap">
          {eq && (
            <>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: '#61616118', color: '#616161' }}>
                {eq.code}
              </span>
              <span className="text-[11px] text-[#616161] truncate">{eq.name}</span>
            </>
          )}
          {item.demandeur_nom && (
            <span className="text-[11px] text-[#616161]">{item.demandeur_nom}</span>
          )}
          {(item.service?.label ?? item.demandeur_service) && (
            <span className="text-[11px] text-[#909090]">· {item.service?.label ?? item.demandeur_service}</span>
          )}
        </div>
      </div>
    </div>
  )

  return onSelect
    ? <button onClick={() => onSelect(item.id)} className="w-full">{content}</button>
    : content
}
