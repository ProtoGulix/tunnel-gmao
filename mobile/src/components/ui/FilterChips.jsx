/**
 * FilterChips — rangée de chips de filtrage avec badge count
 * Utilisé dans EquipementsPage, StockItemList, etc.
 *
 * chips : [{ key, label, count? }]
 * active : key de la chip active (null = "Tous")
 * onChange : (key | null) => void
 * color : couleur hex du chip actif (défaut '#2E2E2E')
 * allLabel : label du bouton "Tous" (défaut 'Tous')
 */
export function FilterChips({ chips, active, onChange, color = '#2E2E2E', allLabel = 'Tous', className = '' }) {
  return (
    <div className={`flex gap-1.5 px-4 py-3 bg-white border-b border-[#E0E0E0] overflow-x-auto shrink-0 ${className}`}>
      <Chip
        label={allLabel}
        count={null}
        active={!active}
        color={color}
        onClick={() => onChange(null)}
      />
      {chips.map(c => (
        <Chip
          key={c.key}
          label={c.label}
          count={c.count}
          active={active === c.key}
          color={color}
          onClick={() => onChange(active === c.key ? null : c.key)}
        />
      ))}
    </div>
  )
}

function Chip({ label, count, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap border transition-colors"
      style={active
        ? { backgroundColor: color, color: 'white', borderColor: 'transparent' }
        : { backgroundColor: '#F4F6F8', color: '#616161', borderColor: '#E0E0E0' }
      }
    >
      {label}
      {count != null && count > 0 && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={active
            ? { backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }
            : { backgroundColor: color + '22', color }
          }
        >
          {count}
        </span>
      )}
    </button>
  )
}
