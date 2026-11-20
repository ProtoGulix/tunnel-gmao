import { useState, useEffect } from 'react'
import { Check, Loader2, FileText, Lock } from 'lucide-react'
import { SheetPicker } from '../ui/SheetPicker'
import { getServices } from '../../api/interventions'
import { createIntervention, getInterventionTypes, getActiveUsers } from '../../api/planning'
import { getErrorMessage } from '../../lib/api/errors'

const inputCls = 'w-full border border-tunnel-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tunnel-accent/30 focus:border-tunnel-accent'
const labelCls = 'text-xs font-bold text-tunnel-text mb-1 block'

const PRIORITY_OPTIONS = [
  { value: 'faible', label: 'Faible' },
  { value: 'normale', label: 'Normale' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
]

const fullName = (u) => (u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : '')

const todayIso = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/**
 * Création d'une intervention en un seul formulaire et un seul appel
 * (POST /interventions, ADR 0025), aligné sur le formulaire de l'accueil du web : demande
 * existante ou nouvelle demande saisie ici (demandeur, service, description qui sert de
 * titre), date de prise en charge, technicien pilote, type, priorité. Pas de tâches à la
 * création. En cas d'erreur rien n'est créé et la saisie est conservée.
 */
export function InterventionCreateForm({ equip, availableDIs, user, canCreateRequest, onCreated, onCancel }) {
  const [mode, setMode] = useState(availableDIs.length === 0 && canCreateRequest ? 'nouvelle' : 'existante')
  const [selectedDI, setSelectedDI] = useState(null)
  const [demandeurNom, setDemandeurNom] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [description, setDescription] = useState('')
  const [reportedDate, setReportedDate] = useState(todayIso)
  const [typeInter, setTypeInter] = useState('CUR')
  const [typeOptions, setTypeOptions] = useState([])
  const [priority, setPriority] = useState('normale')
  const [techId, setTechId] = useState(user?.id ?? '')
  const [users, setUsers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getInterventionTypes().then(setTypeOptions).catch(() => {})
    getServices().then(setServices).catch(() => {})
    getActiveUsers().then(setUsers).catch(() => {})
  }, [])

  // Type imposé par une demande système qui en suggère un (comme l'accueil).
  const lockedType = mode === 'existante' && !!(selectedDI?.is_system && selectedDI?.suggested_type_inter)

  function selectDI(di) {
    setSelectedDI(di)
    if (di.suggested_type_inter) setTypeInter(di.suggested_type_inter)
  }

  async function handleSubmit() {
    if (!techId) { setError('Veuillez sélectionner un technicien'); return }
    if (mode === 'existante' && !selectedDI) { setError('Sélectionner une demande ou en créer une nouvelle'); return }
    if (mode === 'nouvelle') {
      if (!demandeurNom.trim()) { setError('Le nom du demandeur est obligatoire'); return }
      if (!description.trim()) { setError('La description de la demande est obligatoire'); return }
    }

    const payload = {
      machine_id: equip.id,
      type_inter: typeInter,
      tech_id: techId,
      priority,
      status_actual: 'ouvert',
      reported_date: reportedDate || todayIso(),
    }
    if (mode === 'existante') {
      payload.title = selectedDI.description
      payload.request_id = selectedDI.id
      if (selectedDI.demandeur_nom) payload.reported_by = selectedDI.demandeur_nom
    } else {
      payload.title = description.trim()
      payload.reported_by = demandeurNom.trim()
      payload.request = {
        demandeur_nom: demandeurNom.trim(),
        description: description.trim(),
        ...(serviceId ? { service_id: serviceId } : {}),
      }
    }

    setLoading(true)
    setError(null)
    try {
      onCreated(await createIntervention(payload))
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  const techOptions = users.length > 0
    ? users.map(u => ({ value: u.id, label: fullName(u) }))
    : user ? [{ value: user.id, label: fullName(user) }] : []
  const serviceOptions = [{ value: '', label: '— Aucun —' }, ...services.map(s => ({ value: s.id, label: s.label }))]
  const modeBtn = (value, text) => (
    <button type="button" onClick={() => setMode(value)}
      className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${mode === value ? 'bg-tunnel-accent text-white border-tunnel-accent' : 'bg-white text-tunnel-muted border-tunnel-border'}`}>
      {text}
    </button>
  )

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
      )}

      <div className="flex gap-2">
        {modeBtn('existante', 'Demande existante')}
        {canCreateRequest && modeBtn('nouvelle', 'Nouvelle demande')}
      </div>

      {mode === 'existante' ? (
        availableDIs.length === 0 ? (
          <p className="text-xs text-tunnel-muted">Aucune demande disponible pour cet équipement.</p>
        ) : (
          <div className="rounded-lg border border-tunnel-border overflow-hidden">
            {availableDIs.map((di, i) => (
              <button key={di.id} type="button" onClick={() => selectDI(di)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left active:bg-tunnel-bg ${i > 0 ? 'border-t border-tunnel-border' : ''} ${selectedDI?.id === di.id ? 'bg-blue-50' : ''}`}>
                <FileText size={13} className="text-tunnel-accent shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[11px] font-bold text-tunnel-accent">{di.code}</p>
                  <p className="text-xs text-tunnel-muted line-clamp-1 mt-0.5">{di.description}</p>
                </div>
                {selectedDI?.id === di.id && <Check size={14} className="text-tunnel-accent shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Demandeur *</label>
            <input className={inputCls} value={demandeurNom} onChange={e => setDemandeurNom(e.target.value)}
              placeholder="Nom du demandeur" />
          </div>
          <div>
            <label className={labelCls}>Service (optionnel)</label>
            <SheetPicker title="Service" options={serviceOptions} value={serviceId} onChange={setServiceId}
              placeholder="Sélectionner un service…" zIndex={65} />
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea className={inputCls} rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Décrire le problème ou le besoin…" />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Date de prise en charge</label>
        <input type="date" className={inputCls} value={reportedDate} onChange={e => setReportedDate(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className={labelCls}>Type *</label>
          {lockedType ? (
            <div className="w-full flex items-center justify-between gap-2 border border-tunnel-border rounded-lg px-3 py-2.5 bg-tunnel-bg text-sm font-medium text-tunnel-text">
              <span>{typeOptions.find(o => o.id === typeInter)?.title ?? typeInter}</span>
              <Lock size={13} className="text-tunnel-muted shrink-0" />
            </div>
          ) : (
            <SheetPicker title="Type d'intervention"
              options={typeOptions.map(o => ({ value: o.id, label: o.title }))}
              value={typeInter} onChange={setTypeInter} placeholder="Sélectionner un type..." />
          )}
        </div>
        <div className="flex-1">
          <label className={labelCls}>Priorité</label>
          <SheetPicker title="Priorité" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority}
            placeholder="Sélectionner une priorité..." />
        </div>
      </div>

      <div>
        <label className={labelCls}>Technicien pilote *</label>
        <SheetPicker title="Technicien" options={techOptions} value={techId} onChange={setTechId}
          placeholder="Sélectionner un technicien..." />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-tunnel-border text-xs font-medium text-tunnel-muted bg-white active:bg-tunnel-bg">
          Annuler
        </button>
        <button type="button" disabled={loading} onClick={handleSubmit}
          className="flex-1 py-2 rounded-lg bg-tunnel-accent text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Créer l'intervention
        </button>
      </div>
    </div>
  )
}
