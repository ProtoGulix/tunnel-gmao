import { useState, useEffect } from 'react'
import { X, Check, Wrench, Monitor, User, Briefcase, AlignLeft } from 'lucide-react'
import { getEquipements, getServices } from '../../api/interventions'
import { AsyncSearchSelect, SelectionChip } from '../ui/AsyncSearchSelect'
import { SheetPicker } from '../ui/SheetPicker'
import { BottomBar, BottomBtn } from '../ui/BottomBar'
import { useFormGuard } from '../../hooks/shared/useFormGuard.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputCls = 'w-full border border-tunnel-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tunnel-accent/30 focus:border-tunnel-accent'
const labelCls = 'flex items-center gap-1.5 mb-1.5'

export function DIForm({ onSubmit, onClose, status, error }) {
  const [form, setForm] = useState({ demandeur_nom: '', machine_id: '', service_id: '', description: '' })
  const [selectedEquip, setSelectedEquip] = useState(null)
  const [services, setServices] = useState([])

  useEffect(() => {
    getServices().then(setServices).catch(() => {})
  }, [])

  const dirty = !!(form.demandeur_nom || form.machine_id || form.service_id || form.description)
  const { guardedClose, ConfirmDialog } = useFormGuard({ dirty, onClose })

  function handleEquipSelect(equip) {
    setSelectedEquip(equip)
    setForm(p => ({ ...p, machine_id: equip.id }))
  }

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  const serviceOptions = [
    { value: '', label: '— Aucun —' },
    ...services.map(s => ({ value: s.id, label: s.label }))
  ]

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      machine_id: form.machine_id || undefined,
      demandeur_nom: form.demandeur_nom,
      service_id: form.service_id || undefined,
      description: form.description,
    })
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[55] flex flex-col bg-white" style={{ bottom: 'var(--bottom-nav-height)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-tunnel-border bg-blue-50 shrink-0">
        <div className="w-7 h-7 rounded-full bg-tunnel-accent/10 flex items-center justify-center shrink-0">
          <Wrench size={15} className="text-tunnel-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-tunnel-text">Nouvelle demande d'intervention</h2>
        </div>
        <button type="button" onClick={guardedClose} className="p-1.5 text-tunnel-muted">
          <X size={20} />
        </button>
      </div>

      {/* Corps scrollable */}
      <form id="di-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">

          {/* Erreur */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-700">• {error}</p>
            </div>
          )}

          {/* Équipement */}
          <div>
            <div className={labelCls}>
              <Monitor size={14} className="text-tunnel-muted" />
              <span className="text-xs font-bold text-tunnel-text">Équipement</span>
            </div>
            {selectedEquip ? (
              <SelectionChip
                badge={selectedEquip.code}
                label={selectedEquip.name ?? selectedEquip.code}
                onClear={() => { setSelectedEquip(null); setForm(p => ({ ...p, machine_id: '' })) }}
              />
            ) : (
              <AsyncSearchSelect
                fetchFn={getEquipements}
                onSelect={handleEquipSelect}
                renderItem={eq => (
                  <>
                    {eq.code && (
                      <span className="font-mono text-xs bg-tunnel-bg px-1.5 py-0.5 rounded text-tunnel-muted shrink-0">
                        {eq.code}
                      </span>
                    )}
                    <span className="text-sm font-medium text-tunnel-text truncate">{eq.name}</span>
                  </>
                )}
                placeholder="Rechercher un équipement..."
                minChars={1}
              />
            )}
          </div>

          {/* Demandeur */}
          <div>
            <div className={labelCls}>
              <User size={14} className="text-tunnel-muted" />
              <span className="text-xs font-bold text-tunnel-text">Votre nom *</span>
            </div>
            <input
              type="text"
              required
              className={inputCls}
              value={form.demandeur_nom}
              onChange={e => set('demandeur_nom', e.target.value)}
              placeholder="Nom du demandeur"
            />
          </div>

          {/* Service */}
          <div>
            <div className={labelCls}>
              <Briefcase size={14} className="text-tunnel-muted" />
              <span className="text-xs font-bold text-tunnel-text">Service</span>
            </div>
            <SheetPicker
              title="Service"
              options={serviceOptions}
              value={form.service_id}
              onChange={v => set('service_id', v)}
              placeholder="Sélectionner un service…"
              zIndex={70}
            />
          </div>

          {/* Description */}
          <div>
            <div className={labelCls}>
              <AlignLeft size={14} className="text-tunnel-muted" />
              <span className="text-xs font-bold text-tunnel-text">Description *</span>
            </div>
            <textarea
              required
              className={`${inputCls} resize-none`}
              rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Décrivez le problème ou l'intervention souhaitée..."
            />
          </div>

        </div>
      </form>

      {/* Footer */}
      <BottomBar safeBottom={false}>
        <BottomBtn variant="secondary" type="button" onClick={guardedClose}>Annuler</BottomBtn>
        <BottomBtn variant="primary" type="submit" form="di-form"
          disabled={status === 'loading'} loading={status === 'loading'}
          icon={<Check size={14} />}>
          Créer la DI
        </BottomBtn>
      </BottomBar>

      <ConfirmDialog />
    </div>
  )
}
