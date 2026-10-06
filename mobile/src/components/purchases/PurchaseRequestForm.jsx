import { useState } from 'react'
import { X, Check, Loader2, ShoppingCart, Package, AlertCircle, ChevronDown } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { AsyncSearchSelect, SelectionChip } from '../ui/AsyncSearchSelect'
import { useFormGuard } from '../../hooks/shared/useFormGuard.jsx'
import { BottomBar, BottomBtn } from '../ui/BottomBar'
import { searchStockItems, createPurchaseRequest } from '../../api/achats'

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputCls = 'w-full border border-tunnel-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tunnel-accent/30 focus:border-tunnel-accent'
const labelCls = 'flex items-center gap-1.5 mb-1.5'

// ─── SheetPicker — sélecteur bottom-sheet ─────────────────────────────────────
function SheetPicker({ title, options, value, onChange, placeholder = 'Sélectionner...' }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => String(o.value) === String(value))
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 border border-tunnel-border rounded-lg px-3 py-2.5 bg-white text-left focus:outline-none">
        <span className={`text-sm ${selected ? 'font-medium text-tunnel-text' : 'text-tunnel-muted'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-tunnel-muted shrink-0" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={() => setOpen(false)}>
          <div className="bg-white rounded-t-2xl max-h-[72vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 pt-4 pb-3 border-b border-tunnel-border shrink-0 flex items-center justify-between">
              <p className="text-sm font-semibold text-tunnel-text">{title}</p>
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-tunnel-muted font-medium px-2 py-1">Fermer</button>
            </div>
            <div className="overflow-y-auto">
              {options.map(o => {
                const active = String(o.value) === String(value)
                return (
                  <button key={o.value} type="button" onClick={() => { onChange(String(o.value)); setOpen(false) }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-tunnel-border text-left ${active ? 'bg-blue-50' : 'bg-white active:bg-tunnel-bg'}`}>
                    <span className="text-sm text-tunnel-text">{o.label}</span>
                    {active && <Check size={14} className="text-tunnel-accent shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pièce' },
  { value: 'm', label: 'Mètre' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'L', label: 'Litre' },
  { value: 'bidon', label: 'Bidon' },
  { value: 'boîte', label: 'Boîte' },
  { value: 'rouleau', label: 'Rouleau' },
  { value: 'sachet', label: 'Sachet' },
  { value: 'jeu', label: 'Jeu' },
]

const URGENCY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Élevée' },
  { value: 'critical', label: 'Critique' },
]

// ─── Composant principal ──────────────────────────────────────────────────────
export function PurchaseRequestForm({ onClose, onDone, actionId = null, defaultStockItem = null }) {
  const { user } = useAuth()
  const stockItemLocked = defaultStockItem != null

  // Article
  const [stockItem, setStockItem] = useState(defaultStockItem)
  const [isSpecial, setIsSpecial] = useState(false)
  const [itemLabel, setItemLabel] = useState(defaultStockItem?.name ?? '')

  // Champs du formulaire
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState(defaultStockItem?.unit ?? 'pcs')
  const [urgency, setUrgency] = useState('normal')
  const [reason, setReason] = useState('')
  const [requesterName, setRequesterName] = useState(
    user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : ''
  )

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [done, setDone] = useState(false)

  const dirty = !!(stockItem || isSpecial || itemLabel || reason || quantity !== '1')
  const { guardedClose, ConfirmDialog } = useFormGuard({ dirty, onClose })

  function handleStockSelect(item) {
    setStockItem(item)
    setItemLabel(item.name)
    if (item.unit) setUnit(item.unit)
    setIsSpecial(false)
  }

  function handleSpecialMode(searchText) {
    setIsSpecial(true)
    setItemLabel(searchText ?? '')
    setStockItem(null)
  }

  function handleClearArticle() {
    setStockItem(null)
    setIsSpecial(false)
    setItemLabel('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const label = (stockItem ? stockItem.name : itemLabel).trim()
    if (!label) { setSubmitError("La désignation de l'article est requise"); return }
    if (!quantity || Number(quantity) < 1) { setSubmitError('La quantité doit être supérieure à 0'); return }
    setSubmitting(true)
    setSubmitError(null)

    const payload = {
      item_label: label,
      quantity: Number(quantity),
      unit: unit || undefined,
      urgency,
      reason: reason.trim() || undefined,
      requester_name: requesterName.trim() || undefined,
      stock_item_id: stockItem?.id ?? undefined,
      intervention_action_id: actionId ?? undefined,
    }

    try {
      await createPurchaseRequest(payload)
      setDone(true)
      setTimeout(() => { onDone(); onClose() }, 700)
    } catch (err) {
      setSubmitError(err?.data?.detail ?? err.message)
      setSubmitting(false)
    }
  }

  if (done) return (
    <div className="fixed inset-x-0 top-0 z-[55] flex flex-col items-center justify-center bg-white gap-3" style={{ bottom: 'var(--bottom-nav-height)' }}>
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
        <Check size={24} className="text-green-600" />
      </div>
      <p className="text-sm font-medium text-tunnel-text">Demande créée !</p>
    </div>
  )

  return (
    <div className="fixed inset-x-0 top-0 z-[55] flex flex-col bg-white" style={{ bottom: 'var(--bottom-nav-height)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-tunnel-border bg-blue-50 shrink-0">
        <div className="w-7 h-7 rounded-full bg-tunnel-accent/10 flex items-center justify-center shrink-0">
          <ShoppingCart size={15} className="text-tunnel-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-tunnel-text">Nouvelle demande d'achat</h2>
          {actionId && <p className="text-xs text-tunnel-muted">Liée à une action</p>}
        </div>
        <button type="button" onClick={guardedClose} className="p-1.5 text-tunnel-muted">
          <X size={20} />
        </button>
      </div>

      {/* Corps scrollable */}
      <form id="purchase-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">

          {/* Erreur */}
          {submitError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-700">• {submitError}</p>
            </div>
          )}

          {/* ── Article ── */}
          <div>
            <div className={labelCls}>
              <Package size={14} className="text-tunnel-muted" />
              <span className="text-xs font-bold text-tunnel-text">Article *</span>
              {isSpecial && (
                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                  Demande spéciale
                </span>
              )}
            </div>

            {stockItem ? (
              <SelectionChip
                badge={stockItem.ref}
                label={stockItem.name}
                locked={stockItemLocked}
                onClear={handleClearArticle}
              />
            ) : isSpecial ? (
              <div className="flex gap-2">
                <input
                  className={inputCls + ' flex-1'}
                  value={itemLabel}
                  onChange={e => setItemLabel(e.target.value)}
                  placeholder="Désignation de l'article..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleClearArticle}
                  className="shrink-0 p-2.5 rounded-lg border border-tunnel-border text-tunnel-muted bg-white active:bg-tunnel-bg"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <AsyncSearchSelect
                fetchFn={searchStockItems}
                onSelect={handleStockSelect}
                minChars={1}
                placeholder="Rechercher un article du catalogue..."
                onCreateClick={handleSpecialMode}
                createLabel="Demande spéciale"
                renderItem={item => (
                  <div className="flex items-center gap-2.5 w-full min-w-0">
                    <span className="font-mono text-[11px] bg-tunnel-bg px-1.5 py-0.5 rounded text-tunnel-muted shrink-0">
                      {item.ref}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-tunnel-text truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-tunnel-muted">
                        {item.location && <span>{item.location}</span>}
                        {item.quantity != null && (
                          <span className={item.quantity > 0 ? 'text-green-600' : 'text-red-500'}>
                            Stock : {item.quantity} {item.unit ?? ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </div>

          {/* ── Quantité + Unité ── */}
          <div className="flex gap-3">
            <div style={{ flex: '1', minWidth: '80px' }}>
              <div className={labelCls}>
                <span className="text-xs font-bold text-tunnel-text">Quantité *</span>
              </div>
              <input
                type="number"
                min="1"
                className={inputCls + ' text-center'}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <div style={{ flex: '2', minWidth: '120px' }}>
              <div className={labelCls}>
                <span className="text-xs font-bold text-tunnel-text">Unité</span>
              </div>
              <SheetPicker
                title="Unité"
                options={UNIT_OPTIONS}
                value={unit}
                onChange={setUnit}
              />
            </div>
          </div>

          {/* ── Urgence ── */}
          <div>
            <div className={labelCls}>
              <AlertCircle size={14} className="text-tunnel-muted" />
              <span className="text-xs font-bold text-tunnel-text">Urgence</span>
            </div>
            <SheetPicker
              title="Urgence"
              options={URGENCY_OPTIONS}
              value={urgency}
              onChange={setUrgency}
            />
          </div>

          {/* ── Raison ── */}
          <div>
            <div className={labelCls}>
              <span className="text-xs font-bold text-tunnel-text">Raison</span>
            </div>
            <input
              className={inputCls}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Panne, usure, réapprovisionnement..."
            />
          </div>

          {/* ── Demandeur ── */}
          <div>
            <div className={labelCls}>
              <span className="text-xs font-bold text-tunnel-text">Demandeur</span>
            </div>
            <input
              className={inputCls}
              value={requesterName}
              onChange={e => setRequesterName(e.target.value)}
              placeholder="Votre nom"
            />
            <p className="text-[11px] text-tunnel-muted mt-1">Laissez vide pour utiliser "Système"</p>
          </div>

        </div>
      </form>

      {/* Footer */}
      <BottomBar safeBottom={false}>
        <BottomBtn variant="secondary" type="button" onClick={guardedClose}>Annuler</BottomBtn>
        <BottomBtn variant="primary" type="submit" form="purchase-form" disabled={submitting}
          loading={submitting} icon={<Check size={14} />}>
          Créer
        </BottomBtn>
      </BottomBar>

      <ConfirmDialog />
    </div>
  )
}
