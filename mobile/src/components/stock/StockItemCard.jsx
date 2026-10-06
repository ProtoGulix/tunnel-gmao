import { ListRow } from '../ui/ListRow'
import { DynBadge } from '../ui/DynBadge'

export function StockItemCard({ item, onSelect }) {
  const stockColor = item.quantity > 0 ? '#2E7D32' : '#C62828'

  return (
    <ListRow accentColor={stockColor} onClick={() => onSelect(item.id)}>
      {/* Ligne 1 — ref + famille + sous-famille */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <DynBadge color="#1F3A5F" mono>{item.ref}</DynBadge>
        <DynBadge color="#616161">{item.family_code}</DynBadge>
        <DynBadge color="#616161">{item.sub_family_code}</DynBadge>
      </div>

      {/* Ligne 2 — nom */}
      <p className="text-sm font-medium text-[#2E2E2E] leading-snug truncate">{item.name}</p>

      {/* Ligne 3 — quantité + emplacement + fournisseur */}
      <div className="flex items-center gap-2 flex-wrap">
        <DynBadge color={stockColor}>
          {item.quantity} {item.unit ?? 'pcs'}
        </DynBadge>
        {item.location && (
          <span className="text-[11px] text-[#616161]">{item.location}</span>
        )}
        {item.preferred_supplier && (
          <span className="text-[11px] text-[#616161] truncate">{item.preferred_supplier.supplier_name}</span>
        )}
        {!item.preferred_supplier && item.supplier_refs_count > 0 && (
          <span className="text-[11px] text-[#616161]">{item.supplier_refs_count} fourn.</span>
        )}
      </div>
    </ListRow>
  )
}
