import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, User } from 'lucide-react'
import { formatTime } from '../../utils/dateUtils'

const MONTH_SHORT = ['jan.','fév.','mar.','avr.','mai','jun.','jul.','aoû.','sep.','oct.','nov.','déc.']

function formatDateShort(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

// variant="planning" (default) : compact, juste le compteur DA
// variant="detail" : affiche le tech + détail de chaque DA
export function ActionCard({ action, onAddPurchase, variant = 'planning' }) {
  const navigate = useNavigate()
  const cat = action.subcategory?.category
  const sub = action.subcategory
  const inter = action.intervention
  const catColor = cat?.color ?? '#64748b'
  const time = formatTime(action.time_spent)
  const purchases = action.purchase_requests ?? []
  const daCount = purchases.length

  // Badge color: unique color if all same, amber if mixed
  const colors = [...new Set(purchases.map(p => p.derived_status?.color).filter(Boolean))]
  const badgeColor = daCount === 0 ? null : colors.length === 1 ? colors[0] : '#F59E0B'

  const tech = action.tech
  const techName = tech
    ? `${tech.first_name ?? ''} ${tech.last_name ?? ''}`.trim() || tech.initial || null
    : null

  // Supporte aussi bien l'objet imbriqué (vue detail) que les champs plats (vue planning)
  const interCode = inter?.code ?? action.intervention_code ?? action.intervention_id
  const interTitle = inter?.title ?? action.intervention_title ?? null
  const dateShort = formatDateShort(action.action_date ?? action.created_at)
  const interventionId = inter?.id ?? action.intervention_id

  const cardContent = (
    <div
      className="bg-white rounded-lg border border-tunnel-border overflow-hidden"
      style={{ borderLeft: `3px solid ${catColor}` }}
    >
      <div className="px-2.5 py-2 space-y-1.5">

        {/* Code + titre — vue planning seulement */}
        {variant !== 'detail' && (
          <>
            <p className="font-mono text-[11px] font-semibold text-tunnel-text truncate leading-none">
              {interCode}
            </p>
            {interTitle && (
              <p className="text-[11px] text-tunnel-muted truncate leading-none">{interTitle}</p>
            )}
          </>
        )}

        {/* Badge sous-catégorie */}
        {sub && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide"
            style={{ backgroundColor: catColor + '22', color: catColor }}
          >
            {sub.code}
          </span>
        )}

        {/* Description */}
        {action.description && (
          <p className="text-[11px] text-tunnel-muted line-clamp-2 leading-relaxed">
            {action.description}
          </p>
        )}

        {/* ── Vue planning : footer horaires + temps + DA ── */}
        {variant !== 'detail' && (
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-tunnel-muted">
              {action.action_start && action.action_end
                ? `${action.action_start.slice(0, 5)} – ${action.action_end.slice(0, 5)}`
                : null}
            </span>
            <div className="flex items-center gap-1.5">
              {time && (
                <span className="text-[11px] font-semibold" style={{ color: catColor }}>
                  {time}
                </span>
              )}
              <button
                onClick={e => { e.stopPropagation(); onAddPurchase?.(action.id) }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md active:opacity-70"
                style={daCount > 0
                  ? { backgroundColor: badgeColor + '22', color: badgeColor }
                  : { backgroundColor: '#1F3A5F18', color: '#1F3A5F' }
                }
              >
                <ShoppingCart size={10} />
                {daCount > 0
                  ? <span className="text-[10px] font-semibold">{daCount}</span>
                  : <Plus size={8} strokeWidth={2.5} />
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Vue détail : ligne meta compacte + liste DA ── */}
        {variant === 'detail' && (
          <>
            {/* date · sous-cat · horaires · tech · temps · DA sur une seule ligne */}
            <div className="flex items-center gap-1 pt-0.5 flex-wrap">
              {dateShort && (
                <span className="text-[10px] text-tunnel-muted shrink-0">{dateShort}</span>
              )}
              {action.action_start && action.action_end && (
                <>
                  {dateShort && <span className="text-[10px] text-tunnel-muted/40">·</span>}
                  <span className="text-[10px] text-tunnel-muted shrink-0">
                    {action.action_start.slice(0, 5)}–{action.action_end.slice(0, 5)}
                  </span>
                </>
              )}
              {techName && (
                <>
                  <span className="text-[10px] text-tunnel-muted/40">·</span>
                  <User size={9} className="text-tunnel-muted shrink-0" />
                  <span className="text-[10px] text-tunnel-muted truncate max-w-[90px]">{techName}</span>
                </>
              )}
              <span className="flex-1" />
              {time && (
                <span className="text-[11px] font-semibold shrink-0" style={{ color: catColor }}>
                  {time}
                </span>
              )}
              <button
                onClick={e => { e.stopPropagation(); onAddPurchase?.(action.id) }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md active:opacity-70 shrink-0"
                style={daCount > 0
                  ? { backgroundColor: badgeColor + '22', color: badgeColor }
                  : { backgroundColor: '#1F3A5F18', color: '#1F3A5F' }
                }
              >
                <ShoppingCart size={10} />
                {daCount > 0
                  ? <span className="text-[10px] font-semibold">{daCount}</span>
                  : <Plus size={8} strokeWidth={2.5} />
                }
              </button>
            </div>

            {/* Liste des DA */}
            {daCount > 0 && (
              <div className="space-y-1">
                {purchases.map((p, i) => {
                  const pColor = p.derived_status?.color ?? '#94a3b8'
                  const pLabel = p.derived_status?.label
                  const qtyStr = p.quantity != null
                    ? `${p.quantity}${p.unit ? ` ${p.unit}` : ''}`
                    : null
                  return (
                    <div
                      key={p.id ?? i}
                      className="flex items-center justify-between gap-1.5 rounded px-1.5 py-1"
                      style={{ backgroundColor: pColor + '11' }}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <ShoppingCart size={9} style={{ color: pColor, flexShrink: 0 }} />
                        <span className="text-[10px] text-tunnel-text truncate">
                          {p.item_label ?? `DA ${i + 1}`}
                        </span>
                        {qtyStr && (
                          <span className="text-[10px] text-tunnel-muted shrink-0">{qtyStr}</span>
                        )}
                      </div>
                      {pLabel && (
                        <span
                          className="text-[10px] font-medium px-1 py-0.5 rounded shrink-0"
                          style={{ backgroundColor: pColor + '22', color: pColor }}
                        >
                          {pLabel}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )

  return variant === 'planning' && interventionId ? (
    <button
      className="w-full text-left active:opacity-75"
      onClick={() => navigate(`/interventions/${interventionId}`)}
    >
      {cardContent}
    </button>
  ) : cardContent
}
