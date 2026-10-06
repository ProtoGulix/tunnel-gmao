import { useEffect, useState } from 'react'
import { Star, Package, MapPin, Hash, Tag, Layers, Ruler, Box, ShoppingCart } from 'lucide-react'
import { getStockItem } from '../../api/stock'
import { ListStatus } from '../ui/ListStatus'
import { SectionTitle, InfoRow } from '../ui/DetailRows'
import { DynBadge } from '../ui/DynBadge'
import { BottomBar, BottomBtn } from '../ui/BottomBar'
import { PurchaseRequestForm } from '../purchases/PurchaseRequestForm'

function SupplierRow({ supplier }) {
  return (
    <div className="flex items-start gap-0">
      <div
        className="w-1 self-stretch shrink-0"
        style={{ backgroundColor: supplier.is_preferred ? '#ED6C02' : 'transparent' }}
      />
      <div className="flex-1 min-w-0 px-3 py-2.5 space-y-1 border-b border-[#F0F0F0]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {supplier.is_preferred && <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />}
          <span className="text-sm font-medium text-[#2E2E2E]">{supplier.supplier_name}</span>
          <DynBadge color="#1F3A5F" mono>{supplier.supplier_ref}</DynBadge>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#616161]">
          {supplier.unit_price != null && (
            <span className="font-medium text-[#2E2E2E]">{supplier.unit_price.toFixed(2)} €</span>
          )}
          {supplier.delivery_time_days != null && <span>{supplier.delivery_time_days}j délai</span>}
          {supplier.min_order_quantity != null && <span>min. {supplier.min_order_quantity}</span>}
        </div>
        {supplier.manufacturer_item && (
          <p className="text-[11px] text-[#616161]">
            {supplier.manufacturer_item.manufacturer_name} · {supplier.manufacturer_item.manufacturer_ref}
          </p>
        )}
      </div>
    </div>
  )
}

function CharacteristicRow({ char }) {
  const value = char.value_number ?? char.value_text ?? char.value_enum ?? '—'
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F0F0F0] last:border-0">
      <span className="font-mono text-[11px] text-[#909090] w-28 shrink-0 mt-0.5">{char.key}</span>
      <span className="text-xs text-[#909090] flex-1">{char.label}</span>
      <span className="text-sm font-medium text-[#2E2E2E] tabular-nums">{value}</span>
    </div>
  )
}

export function StockItemDetail({ id, openPurchaseOnMount = false }) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setItem(null)
    getStockItem(id)
      .then(data => { setItem(data); if (openPurchaseOnMount) setShowForm(true) })
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line

  if (loading || error || !item) return (
    <div className="flex-1">
      <ListStatus loading={loading} error={error} empty={!loading && !error && !item} emptyMessage="Article introuvable" />
    </div>
  )

  const stockColor = item.quantity > 0 ? '#2E7D32' : '#C62828'

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        {/* Bandeau stock */}
        <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: stockColor + '18' }}>
          <Box size={18} style={{ color: stockColor }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: stockColor }}>
              {item.quantity > 0 ? 'En stock' : 'Rupture de stock'}
            </p>
            {item.location && (
              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: stockColor + 'CC' }}>
                <MapPin size={11} />
                {item.location}
              </p>
            )}
          </div>
          <DynBadge color={stockColor} size="sm">
            {item.quantity} {item.unit ?? 'pcs'}
          </DynBadge>
        </div>

        {/* Infos principales */}
        <div className="bg-white mt-2 px-4">
          <InfoRow icon={Hash}   label="Référence"    value={item.ref} />
          <InfoRow icon={Tag}    label="Famille"      value={item.family_code} />
          <InfoRow icon={Layers} label="Sous-famille" value={item.sub_family_code} />
          <InfoRow icon={Tag}    label="Spec."        value={item.spec} />
          <InfoRow icon={Ruler}  label="Dimension"    value={item.dimension} />
          <InfoRow icon={MapPin} label="Emplacement"  value={item.location} />
        </div>

        {/* Template */}
        {item.sub_family_template && (
          <div className="mt-2">
            <SectionTitle>Template · {item.sub_family_template.code}</SectionTitle>
            <div className="bg-white px-4">
              <InfoRow icon={Hash} label="Pattern" value={item.sub_family_template.pattern} />
            </div>
          </div>
        )}

        {/* Caractéristiques */}
        {item.characteristics?.length > 0 && (
          <div className="mt-2">
            <SectionTitle>Caractéristiques ({item.characteristics.length})</SectionTitle>
            <div className="bg-white px-4">
              {item.characteristics.map(c => (
                <CharacteristicRow key={c.field_id} char={c} />
              ))}
            </div>
          </div>
        )}

        {/* Fournisseurs */}
        <div className="mt-2 mb-4">
          <SectionTitle>Fournisseurs{item.suppliers?.length ? ` (${item.suppliers.length})` : ''}</SectionTitle>
          {item.suppliers?.length ? (
            <div className="bg-white">
              {item.suppliers.map(s => <SupplierRow key={s.id} supplier={s} />)}
            </div>
          ) : (
            <div className="bg-white px-4 py-4 flex items-center gap-2 text-sm text-[#616161]">
              <Package size={14} />
              Aucun fournisseur référencé
            </div>
          )}
        </div>
      </div>

      <BottomBar>
        <BottomBtn
          variant="primary"
          icon={<ShoppingCart size={16} />}
          onClick={() => setShowForm(true)}
        >
          Demande d'achat
        </BottomBtn>
      </BottomBar>

      {showForm && (
        <PurchaseRequestForm
          defaultStockItem={{ id: item.id, name: item.name, ref: item.ref, unit: item.unit }}
          onClose={() => setShowForm(false)}
          onDone={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
