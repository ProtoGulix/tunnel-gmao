import { useState, useEffect, useMemo } from 'react'
import { X, ChevronLeft, Check, Loader2, Clock, CalendarDays, Tag, AlignLeft, BarChart3, ChevronDown, Wrench, Plus, ChevronRight, FileText, Hammer, Lock, CheckSquare } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { AsyncSearchSelect, SelectionChip } from '../ui/AsyncSearchSelect'
import { TaskStatusBadge } from '../ui/TaskStatusBadge'
import { useActionForm } from '../../hooks/interventions/useActionForm'
import { useFormGuard } from '../../hooks/shared/useFormGuard.jsx'
import { BottomBar, BottomBtn } from '../ui/BottomBar'
import { SheetPicker } from '../ui/SheetPicker'
import { getEquipements, getServices } from '../../api/interventions'
import { getActionCategories, getComplexityFactors, createAction, searchInterventions, searchDI, createDI, createIntervention, getInterventionTypes } from '../../api/planning'
import { getOpenTasksByIntervention, createTask } from '../../api/tasks'

// ─── Styles ──────────────────────────────────────────────────────────────────
const inputCls = 'w-full border border-tunnel-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tunnel-accent/30 focus:border-tunnel-accent'
const labelCls = 'flex items-center gap-1.5 mb-1.5'

// ─── CategoryPicker bottom-sheet ─────────────────────────────────────────────
function CategoryPicker({ categories, selected, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={onClose}>
      <div className="bg-white rounded-t-2xl max-h-[72vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-3 border-b border-tunnel-border shrink-0 flex items-center justify-between">
          <p className="text-sm font-semibold text-tunnel-text">Type d'action</p>
          <button onClick={onClose} className="text-xs text-tunnel-muted font-medium px-2 py-1">Fermer</button>
        </div>
        <div className="overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.id}>
              <div className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-50"
                style={{ borderLeft: `4px solid ${cat.color ?? '#6b7280'}`, borderBottom: '1px solid #e2e8f0' }}>
                {cat.name}
              </div>
              {(cat.subcategories ?? []).map(sub => {
                const active = String(sub.id) === String(selected)
                return (
                  <button key={sub.id} onClick={() => { onSelect(String(sub.id)); onClose() }}
                    className={`w-full flex items-center gap-3 pl-6 pr-4 py-3 border-b border-tunnel-border text-left ${active ? 'bg-blue-50' : 'bg-white active:bg-tunnel-bg'}`}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white shrink-0"
                      style={{ backgroundColor: cat.color ?? '#6b7280' }}>
                      {sub.code}
                    </span>
                    <span className="flex-1 text-sm text-tunnel-text">{sub.name}</span>
                    {active && <Check size={14} className="text-tunnel-accent shrink-0" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Calcul durée depuis bornes ───────────────────────────────────────────────
function calcDuration(start, end) {
  if (!start || !end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return ''
  const quarters = Math.round(mins / 15)
  return String(quarters * 0.25)
}

function formatDuration(val) {
  const n = parseFloat(val)
  if (!n) return ''
  const h = Math.floor(n)
  const m = Math.round((n - h) * 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h00`
  return `${h}h${String(m).padStart(2, '0')}`
}

// ─── Section pliable ──────────────────────────────────────────────────────────
function CollapsibleSection({ icon: Icon, iconColor = '#64748b', title, badge, open, onToggle, children }) {
  return (
    <div className="rounded-xl border border-tunnel-border overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white active:bg-tunnel-bg text-left">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconColor + '18' }}>
          <Icon size={14} style={{ color: iconColor }} />
        </div>
        <span className="flex-1 text-sm font-semibold text-tunnel-text">{title}</span>
        {badge && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            {badge}
          </span>
        )}
        <ChevronRight size={14} className={`text-tunnel-muted shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-white border-t border-tunnel-border space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Formulaire DI inline ──────────────────────────────────────────────────────
function DIInlineForm({ equip, user, onCreated, onCancel }) {
  const [demandeurNom, setDemandeurNom] = useState(
    user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : ''
  )
  const [serviceId, setServiceId] = useState('')
  const [services, setServices] = useState([])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getServices().then(setServices).catch(() => {})
  }, [])

  const serviceOptions = [
    { value: '', label: '— Aucun —' },
    ...services.map(s => ({ value: s.id, label: s.label }))
  ]

  async function handleSubmit() {
    if (!demandeurNom.trim()) { setError('Le nom du demandeur est requis'); return }
    if (!description.trim()) { setError('La description est requise'); return }
    setLoading(true)
    setError(null)
    try {
      const di = await createDI({
        machine_id: equip.id,
        demandeur_nom: demandeurNom.trim(),
        service_id: serviceId || undefined,
        description: description.trim(),
      })
      onCreated(di)
    } catch (err) {
      setError(err?.data?.detail ?? err.message ?? 'Erreur lors de la création')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
      )}
      <div>
        <label className="text-xs font-bold text-tunnel-text mb-1 block">Nom du demandeur *</label>
        <input className={inputCls} value={demandeurNom} onChange={e => setDemandeurNom(e.target.value)}
          placeholder="Jean Dupont" />
      </div>
      <div>
        <label className="text-xs font-bold text-tunnel-text mb-1 block">Service</label>
        <SheetPicker
          title="Service"
          options={serviceOptions}
          value={serviceId}
          onChange={setServiceId}
          placeholder="Sélectionner un service…"
          zIndex={65}
        />
      </div>
      <div>
        <label className="text-xs font-bold text-tunnel-text mb-1 block">Description *</label>
        <textarea className={`${inputCls} resize-none`} rows={3} value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Décris le problème constaté..." />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-tunnel-border text-xs font-medium text-tunnel-muted bg-white active:bg-tunnel-bg">
          Annuler
        </button>
        <button type="button" disabled={loading} onClick={handleSubmit}
          className="flex-1 py-2 rounded-lg bg-tunnel-accent text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Créer la DI
        </button>
      </div>
    </div>
  )
}

// ─── Section Tâche (lien obligatoire action↔tâche) ────────────────────────────
function TaskSection({ interventionId, selectedTaskId, onSelect, closeTask, onCloseTaskChange }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setTasks([])
    onSelect(null)
    if (!interventionId) return
    setLoading(true)
    getOpenTasksByIntervention(interventionId)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventionId])

  async function handleCreate() {
    if (!newLabel.trim()) return
    setCreating(true)
    setError(null)
    try {
      const task = await createTask({ interventionId, label: newLabel.trim() })
      setTasks(prev => [...prev, task])
      onSelect(task.id)
      setNewLabel('')
      setShowCreate(false)
    } catch (err) {
      setError(err?.data?.detail ?? err.message ?? 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className={labelCls}>
        <CheckSquare size={14} className="text-tunnel-muted" />
        <span className="text-xs font-bold text-tunnel-text">Tâche</span>
        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">Obligatoire</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-tunnel-muted">
          <Loader2 size={14} className="animate-spin" /> Chargement...
        </div>
      ) : tasks.length > 0 ? (
        <div className="rounded-lg border border-tunnel-border overflow-hidden">
          {tasks.map((task, i) => (
            <button key={task.id} type="button" onClick={() => onSelect(task.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-tunnel-bg ${i > 0 ? 'border-t border-tunnel-border' : ''} ${selectedTaskId === task.id ? 'bg-blue-50' : ''}`}>
              <span className="flex-1 text-sm text-tunnel-text line-clamp-1">{task.label}</span>
              <TaskStatusBadge status={task.status} />
              {selectedTaskId === task.id && <Check size={14} className="text-tunnel-accent shrink-0" />}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-tunnel-muted px-3 py-2.5 rounded-lg border border-dashed border-tunnel-border bg-tunnel-bg">
          Aucune tâche ouverte sur cette intervention
        </p>
      )}

      {selectedTaskId && (
        <label className="flex items-center gap-2 mt-2 px-1">
          <input
            type="checkbox"
            checked={closeTask}
            onChange={e => onCloseTaskChange(e.target.checked)}
            className="w-4 h-4 accent-tunnel-accent"
          />
          <span className="text-xs text-tunnel-text">Cette action termine la tâche</span>
        </label>
      )}

      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}

      {showCreate ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            className={inputCls}
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Libellé de la tâche…"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && newLabel.trim()) { e.preventDefault(); handleCreate() } }}
          />
          <button type="button" disabled={!newLabel.trim() || creating} onClick={handleCreate}
            className="shrink-0 px-3 py-2.5 rounded-lg bg-tunnel-accent text-white text-xs font-semibold disabled:opacity-50">
            {creating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          </button>
          <button type="button" onClick={() => { setShowCreate(false); setNewLabel('') }}
            className="shrink-0 px-2 py-2.5 rounded-lg border border-tunnel-border text-tunnel-muted">
            <X size={13} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowCreate(true)}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-tunnel-accent">
          <Plus size={12} /> Nouvelle tâche
        </button>
      )}
    </div>
  )
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const COMPLEXITY_OPTIONS = [
  { value: '1', label: '1 — Très simple' },
  { value: '2', label: '2 — Simple' },
  { value: '3', label: '3 — Facile' },
  { value: '4', label: '4 — Moyen-' },
  { value: '5', label: '5 — Moyen' },
  { value: '6', label: '6 — Moyen+' },
  { value: '7', label: '7 — Difficile' },
  { value: '8', label: '8 — Complexe' },
  { value: '9', label: '9 — Très complexe' },
  { value: '10', label: '10 — Expert' },
]

// ─── Formulaire Intervention inline (dans ActionForm) ────────────────────────
const PRIORITY_OPTIONS_INLINE = [
  { value: 'faible',    label: 'Faible' },
  { value: 'normale',   label: 'Normale' },
  { value: 'important', label: 'Important' },
  { value: 'urgent',    label: 'Urgent' },
]

function InterventionInlineForm({ equip, di, user, onCreated, onCancel }) {
  const [title, setTitle] = useState(di?.description ?? '')
  const [typeInter, setTypeInter] = useState('')
  const [typeOptions, setTypeOptions] = useState([])
  const [priority, setPriority] = useState('normale')
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const techInitials = user?.initial ?? (user ? `${(user.first_name ?? '')[0] ?? ''}${(user.last_name ?? '')[0] ?? ''}`.toUpperCase() : 'XX')

  useEffect(() => {
    getInterventionTypes().then(types => {
      setTypeOptions(types)
      if (types.length > 0) setTypeInter(types[0].id)
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const inter = await createIntervention({
        machine_id: equip.id,
        type_inter: typeInter,
        tech_initials: techInitials,
        title: title.trim() || undefined,
        priority,
        reported_date: reportedDate || undefined,
        request_id: di?.id,
      })
      onCreated(inter)
    } catch (err) {
      setError(err?.data?.detail ?? err.message ?? 'Erreur lors de la création')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {di && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
          <FileText size={13} className="text-tunnel-accent shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-tunnel-accent">{di.code}</p>
            <p className="text-[11px] text-tunnel-muted line-clamp-1">{di.description}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
      )}
      <div>
        <label className="text-xs font-bold text-tunnel-text mb-1 block">Titre</label>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Titre de l'intervention" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-bold text-tunnel-text mb-1 block">Type *</label>
          <SheetPicker
            title="Type d'intervention"
            options={typeOptions.map(o => ({ value: o.id, label: o.title }))}
            value={typeInter}
            onChange={setTypeInter}
            placeholder="Sélectionner un type..."
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-tunnel-text mb-1 block">Priorité</label>
          <SheetPicker
            title="Priorité"
            options={PRIORITY_OPTIONS_INLINE}
            value={priority}
            onChange={setPriority}
            placeholder="Sélectionner une priorité..."
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-tunnel-text mb-1 block">Date de signalement</label>
        <input type="date" className={inputCls} value={reportedDate}
          onChange={e => setReportedDate(e.target.value)} />
      </div>
      <div className="text-[11px] text-tunnel-muted">
        Initiales technicien : <span className="font-mono font-bold text-tunnel-text">{techInitials}</span>
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

// ─── Formulaire principal ─────────────────────────────────────────────────────
export function ActionForm({ actionDate, onClose, onDone, defaultEquip = null, defaultIntervention = null, mode = 'modal' }) {
  const { user } = useAuth()
  const { formState, handlers, validation } = useActionForm({ date: actionDate })

  // Équipement — déduit de defaultIntervention si fourni
  const [equip, setEquip] = useState(defaultIntervention?.equipements ?? defaultEquip)
  const equipLocked = !!defaultEquip || !!defaultIntervention

  // DI chargées pour l'équipement
  const [dis, setDis] = useState([])
  const [loadingDI, setLoadingDI] = useState(false)
  // DI sélectionnée (pour créer une intervention dessus)
  const [selectedDI, setSelectedDI] = useState(null)

  // Sections inline
  const [showDIForm, setShowDIForm] = useState(false)
  const [showInterForm, setShowInterForm] = useState(false)

  // Intervention sélectionnée
  const [intervention, setIntervention] = useState(defaultIntervention)
  const [interventions, setInterventions] = useState([])
  const [loadingInter, setLoadingInter] = useState(false)

  // Tâche liée (obligatoire)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [closeTask, setCloseTask] = useState(false)

  function handleSelectTask(taskId) {
    setSelectedTaskId(taskId)
    setCloseTask(false)
  }

  // Catégories / facteurs
  const [categories, setCategories] = useState([])
  const [factors, setFactors] = useState([])
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  // Bornes horaires
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [done, setDone] = useState(false)

  const dirty = !!(equip || intervention || formState.description || formState.time || timeStart || timeEnd || formState.category)
  const { guardedClose, ConfirmDialog } = useFormGuard({ dirty, onClose })

  useEffect(() => {
    getActionCategories().then(setCategories).catch(() => {})
    getComplexityFactors().then(setFactors).catch(() => {})
  }, [])

  // Charger interventions + DI quand l'équipement change
  useEffect(() => {
    if (!equip) {
      setInterventions([]); if (!defaultIntervention) setIntervention(null)
      setDis([]); setSelectedDI(null)
      setShowDIForm(false); setShowInterForm(false)
      return
    }
    // Si l'intervention est déjà verrouillée, pas besoin de charger la liste
    if (defaultIntervention) return
    setLoadingInter(true)
    setIntervention(null)
    setShowDIForm(false); setShowInterForm(false)

    Promise.all([
      searchInterventions({ equipement_id: equip.id, status: 'ouvert,en_cours,en_attente_pieces,en_attente_prod', limit: 30 }),
      searchDI({ machine_id: equip.id }),
    ]).then(([inters, diItems]) => {
      setInterventions(inters)
      setDis(diItems)
    }).catch(() => {
      setInterventions([])
      setDis([])
    }).finally(() => setLoadingInter(false))
  }, [equip])

  // Recalculer durée depuis bornes
  useEffect(() => {
    const dur = calcDuration(timeStart, timeEnd)
    if (dur) handlers.handleTimeChange(dur)
  }, [timeStart, timeEnd])

  const selectedSubcat = useMemo(() => {
    for (const cat of categories) {
      const sub = cat.subcategories?.find(s => String(s.id) === String(formState.category))
      if (sub) return { sub, cat }
    }
    return null
  }, [categories, formState.category])

  // Aucune intervention ouverte → proposer création
  const noOpenInterventions = !loadingInter && equip && interventions.length === 0
  // DI disponibles (nouvelle) pour lier à une intervention
  const availableDIs = dis.filter(d => d.statut === 'nouvelle' || d.statut === 'en_attente')
  const noDI = !loadingInter && equip && availableDIs.length === 0

  function handleDICreated(di) {
    setDis(prev => [di, ...prev])
    setSelectedDI(di)
    setShowDIForm(false)
    setShowInterForm(true)
  }

  function handleInterCreated(inter) {
    setInterventions(prev => [inter, ...prev])
    setIntervention(inter)
    setShowInterForm(false)
    setSelectedDI(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!intervention) { setSubmitError('Sélectionner une intervention'); return }
    if (!selectedTaskId) { setSubmitError('Sélectionner ou créer une tâche liée à cette action'); return }
    if (!handlers.handleValidate()) return
    setSubmitting(true)
    setSubmitError(null)

    const now = new Date()
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`

    const payload = {
      intervention_id: intervention.id,
      action_subcategory: Number(formState.category) || undefined,
      tech: user.id,
      description: formState.description,
      complexity_score: Number(formState.complexity),
      complexity_factor: Number(formState.complexity) > 5 ? formState.complexityFactors[0] : undefined,
      created_at: `${formState.date}T${ts}`,
      tasks: [{ task_id: selectedTaskId, close_task: closeTask }],
    }

    if (timeStart && timeEnd && calcDuration(timeStart, timeEnd)) {
      payload.action_start = `${timeStart}:00`
      payload.action_end = `${timeEnd}:00`
    } else if (formState.time) {
      payload.time_spent = Number(formState.time)
    }

    try {
      await createAction(payload)
      setDone(true)
      setTimeout(() => { onDone(); onClose() }, 700)
    } catch (err) {
      setSubmitError(err?.data?.detail ?? err.message)
      setSubmitting(false)
    }
  }

  const containerCls = mode === 'page'
    ? 'flex flex-col h-full bg-white'
    : 'fixed inset-x-0 top-0 z-[55] flex flex-col bg-white'
  const containerStyle = mode === 'modal' ? { bottom: 'var(--bottom-nav-height)' } : undefined

  if (done) return (
    <div className={`${containerCls} items-center justify-center gap-3`} style={containerStyle}>
      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
        <Check size={24} className="text-green-600" />
      </div>
      <p className="text-sm font-medium text-tunnel-text">Action enregistrée !</p>
    </div>
  )

  const hasErrors = validation.errors.length > 0

  return (
    <div className={containerCls} style={containerStyle}>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-tunnel-border bg-blue-50 shrink-0">
        <div className="w-7 h-7 rounded-full bg-tunnel-accent/10 flex items-center justify-center shrink-0">
          <Plus size={15} className="text-tunnel-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-tunnel-text">Nouvelle action</h2>
          {intervention && (
            <p className="text-xs font-mono text-tunnel-muted truncate">{intervention.code}</p>
          )}
        </div>
        <button type="button" onClick={guardedClose} className="p-1.5 text-tunnel-muted">
          {mode === 'page' ? <ChevronLeft size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Corps scrollable */}
      <form id="action-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">

            {/* Erreurs */}
            {(hasErrors || submitError) && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-bold text-red-700 mb-1">Erreur</p>
                {validation.errors.map((e, i) => <p key={i} className="text-xs text-red-700">• {e}</p>)}
                {submitError && <p className="text-xs text-red-700">• {submitError}</p>}
              </div>
            )}

            {/* ── Équipement ── */}
            <div>
              <div className={labelCls}>
                <Wrench size={14} className="text-tunnel-muted" />
                <span className="text-xs font-bold text-tunnel-text">Équipement</span>
              </div>
              {equip ? (
                <SelectionChip
                  badge={equip.code}
                  label={equip.name ?? equip.code}
                  locked={equipLocked}
                  onClear={equipLocked ? undefined : () => { setEquip(null); setIntervention(null) }}
                />
              ) : (
                <AsyncSearchSelect
                  fetchFn={getEquipements}
                  onSelect={setEquip}
                  renderItem={eq => {
                    const h = eq.health
                    const healthDot = h?.level === 'critical'
                      ? { color: '#ef4444', title: 'Critique' }
                      : h?.level === 'maintenance'
                      ? { color: '#f59e0b', title: 'En maintenance' }
                      : { color: '#22c55e', title: 'OK' }
                    return (
                      <div className="flex items-center gap-2.5 w-full min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: healthDot.color }}
                          title={healthDot.title}
                        />
                        {eq.code && (
                          <span className="font-mono text-xs bg-tunnel-bg px-1.5 py-0.5 rounded text-tunnel-muted shrink-0">
                            {eq.code}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-tunnel-text truncate">{eq.name}</p>
                          {h?.reason && h.level !== 'ok' && (
                            <p className="text-[11px] truncate" style={{ color: healthDot.color }}>
                              {h.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  }}
                  placeholder="Rechercher un équipement..."
                  minChars={1}
                />
              )}
            </div>

            {/* ── Intervention ── */}
            {equip && (
              <div>
                <div className={labelCls}>
                  <Hammer size={14} className="text-tunnel-muted" />
                  <span className="text-xs font-bold text-tunnel-text">Intervention *</span>
                </div>

                {loadingInter ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-tunnel-muted">
                    <Loader2 size={14} className="animate-spin" /> Chargement...
                  </div>
                ) : intervention ? (
                  <SelectionChip
                    badge={intervention.code}
                    label={intervention.title ?? intervention.code}
                    locked={!!defaultIntervention}
                    onClear={defaultIntervention ? undefined : () => setIntervention(null)}
                  />
                ) : interventions.length > 0 ? (
                  <div className="rounded-lg border border-tunnel-border overflow-hidden">
                    {interventions.map((inter, i) => (
                      <button key={inter.id} type="button" onClick={() => setIntervention(inter)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left active:bg-tunnel-bg ${i > 0 ? 'border-t border-tunnel-border' : ''}`}>
                        <span className="font-mono text-[11px] text-tunnel-muted shrink-0 mt-0.5">{inter.code}</span>
                        <span className="flex-1 text-sm font-medium text-tunnel-text line-clamp-1">{inter.title ?? '—'}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* Aucune intervention ouverte → création en cascade */}
                {noOpenInterventions && !intervention && (
                  <div className="mt-3 space-y-3">
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-800 mb-0.5">Aucune intervention ouverte</p>
                      <p className="text-[11px] text-amber-700">Cet équipement n'a pas d'intervention active. Sélectionne une DI existante ou crée-en une nouvelle pour démarrer.</p>
                    </div>

                    {/* DI disponibles */}
                    {availableDIs.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-tunnel-text mb-2">Demandes d'intervention disponibles</p>
                        <div className="rounded-lg border border-tunnel-border overflow-hidden">
                          {availableDIs.map((di, i) => (
                            <button key={di.id} type="button"
                              onClick={() => { setSelectedDI(di); setShowInterForm(true); setShowDIForm(false) }}
                              className={`w-full flex items-start gap-3 px-4 py-3 text-left active:bg-tunnel-bg ${i > 0 ? 'border-t border-tunnel-border' : ''} ${selectedDI?.id === di.id ? 'bg-blue-50' : ''}`}>
                              <FileText size={13} className="text-tunnel-accent shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-[11px] font-bold text-tunnel-accent">{di.code}</p>
                                <p className="text-xs text-tunnel-muted line-clamp-1 mt-0.5">{di.description}</p>
                              </div>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                                style={{ backgroundColor: (di.statut_color ?? '#6b7280') + '22', color: di.statut_color ?? '#6b7280' }}>
                                {di.statut_label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex gap-2">
                      {noDI && !showDIForm && (
                        <button type="button" onClick={() => { setShowDIForm(true); setShowInterForm(false) }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-tunnel-accent text-tunnel-accent text-xs font-semibold active:bg-blue-50">
                          <Plus size={13} /> Nouvelle DI
                        </button>
                      )}
                      {!noDI && !showDIForm && !showInterForm && (
                        <button type="button" onClick={() => { setShowDIForm(true) }}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-tunnel-border text-tunnel-muted text-xs font-medium active:bg-tunnel-bg">
                          <Plus size={12} /> Nouvelle DI
                        </button>
                      )}
                      {availableDIs.length > 0 && !showInterForm && (
                        <button type="button"
                          onClick={() => { setShowInterForm(true); setShowDIForm(false); setSelectedDI(null) }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-tunnel-accent text-white text-xs font-semibold active:opacity-90">
                          <Hammer size={13} /> Créer l'intervention
                        </button>
                      )}
                    </div>

                    {/* Formulaire DI inline */}
                    {showDIForm && (
                      <CollapsibleSection icon={FileText} iconColor="#3B82F6" title="Nouvelle demande d'intervention"
                        open={true} onToggle={() => {}}>
                        <DIInlineForm equip={equip} user={user}
                          onCreated={handleDICreated}
                          onCancel={() => setShowDIForm(false)} />
                      </CollapsibleSection>
                    )}

                    {/* Formulaire Intervention inline */}
                    {showInterForm && (
                      <CollapsibleSection icon={Hammer} iconColor="#F59E0B" title="Nouvelle intervention"
                        badge={selectedDI?.code}
                        open={true} onToggle={() => {}}>
                        <InterventionInlineForm
                          equip={equip}
                          di={selectedDI}
                          user={user}
                          onCreated={handleInterCreated}
                          onCancel={() => { setShowInterForm(false); setSelectedDI(null) }} />
                      </CollapsibleSection>
                    )}
                  </div>
                )}
              </div>
            )}

            {!equip && (
              <div>
                <div className={labelCls}>
                  <Hammer size={14} className="text-tunnel-muted" />
                  <span className="text-xs font-bold text-tunnel-text">Intervention *</span>
                </div>
                <p className="text-xs text-tunnel-muted px-3 py-2.5 rounded-lg border border-dashed border-tunnel-border bg-tunnel-bg">
                  Sélectionnez d'abord un équipement
                </p>
              </div>
            )}

            {/* ── Tâche (obligatoire) ── */}
            {intervention && (
              <TaskSection
                interventionId={intervention.id}
                selectedTaskId={selectedTaskId}
                onSelect={handleSelectTask}
                closeTask={closeTask}
                onCloseTaskChange={setCloseTask}
              />
            )}

            {/* ── Date ── */}
            <div>
              <div className={labelCls}>
                <CalendarDays size={14} className="text-tunnel-muted" />
                <span className="text-xs font-bold text-tunnel-text">Date</span>
              </div>
              <input type="date" value={formState.date}
                onChange={e => handlers.handleDateChange(e.target.value)}
                className={inputCls} />
            </div>

            {/* ── Plage horaire | Durée ── */}
            <div className="flex gap-3 flex-wrap">
              <div style={{ flex: '2', minWidth: '140px' }}>
                <div className={labelCls}>
                  <Clock size={14} className="text-tunnel-muted" />
                  <span className="text-xs font-bold text-tunnel-text">Plage horaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)}
                    className={inputCls + ' text-center'} />
                  <span className="text-tunnel-muted text-xs shrink-0">à</span>
                  <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)}
                    className={inputCls + ' text-center'} />
                </div>
              </div>

              <div style={{ flex: '1', minWidth: '80px' }}>
                <div className={labelCls}>
                  <Clock size={14} className="text-tunnel-muted" />
                  <span className="text-xs font-bold text-tunnel-text">Durée</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-amber-300 bg-amber-50">
                  <span className="flex-1 text-sm text-tunnel-text">
                    {formState.time ? formatDuration(formState.time) : <span className="text-tunnel-muted">—</span>}
                  </span>
                  <Lock size={13} className="shrink-0 text-amber-500" />
                </div>
              </div>
            </div>

            {/* ── Type d'action ── */}
            <div>
              <div className={labelCls}>
                <Tag size={14} className="text-tunnel-muted" />
                <span className="text-xs font-bold text-tunnel-text">Type</span>
              </div>
              <button type="button" onClick={() => setShowCategoryPicker(true)}
                className={`w-full flex items-center justify-between gap-2 border border-tunnel-border rounded-lg px-3 py-2.5 bg-white text-left focus:outline-none ${!selectedSubcat ? 'text-tunnel-muted' : 'text-tunnel-text'}`}>
                {selectedSubcat ? (
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-white shrink-0"
                      style={{ backgroundColor: selectedSubcat.cat.color ?? '#6b7280' }}>
                      {selectedSubcat.sub.code}
                    </span>
                    <span className="text-sm truncate">{selectedSubcat.sub.name}</span>
                  </span>
                ) : (
                  <span className="text-sm text-tunnel-muted">Sélectionner...</span>
                )}
                <ChevronDown size={14} className="text-tunnel-muted shrink-0" />
              </button>
            </div>

            {/* ── Description ── */}
            <div>
              <div className={labelCls}>
                <AlignLeft size={14} className="text-tunnel-muted" />
                <span className="text-xs font-bold text-tunnel-text">Description de l'action</span>
                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">Obligatoire</span>
              </div>
              <textarea className={`${inputCls} resize-none`} rows={4}
                value={formState.description}
                onChange={e => handlers.handleDescriptionChange(e.target.value)}
                placeholder="Décris en détail ce qui a été fait : diagnostic, réparation, remplacement..." />
              <p className="text-[11px] text-tunnel-muted mt-1">Sois précis : cela aide pour l'analyse et les prochaines interventions</p>
            </div>

            {/* ── Complexité ── */}
            <div>
              <div className={labelCls}>
                <BarChart3 size={14} className="text-tunnel-muted" />
                <span className="text-xs font-bold text-tunnel-text">Complexité *</span>
              </div>
              <SheetPicker
                title="Complexité"
                options={COMPLEXITY_OPTIONS}
                value={formState.complexity}
                onChange={handlers.handleComplexityChange}
                placeholder="Sélectionner..."
              />
            </div>

            {/* ── Facteurs de complexité ── */}
            {validation.shouldShowComplexityFactors && (
              <div>
                <div className={labelCls}>
                  <BarChart3 size={14} className="text-orange-500" />
                  <span className="text-xs font-bold text-tunnel-text">Facteurs de complexité</span>
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">Obligatoire si &gt; 5</span>
                </div>
                <SheetPicker
                  title="Facteur de complexité"
                  options={factors.map(f => ({ value: f.code ?? f.id, label: f.label }))}
                  value={formState.complexityFactors[0] ?? ''}
                  onChange={handlers.handleComplexityFactorSet}
                  placeholder="Sélectionner un facteur..."
                />
              </div>
            )}

          </div>
      </form>

      {/* Footer */}
      <BottomBar>
        <BottomBtn variant="secondary" type="button" onClick={guardedClose}>Annuler</BottomBtn>
        <BottomBtn variant="primary" type="submit" form="action-form" disabled={submitting}
          loading={submitting} icon={<Plus size={14} />}>
          Enregistrer
        </BottomBtn>
      </BottomBar>

      {showCategoryPicker && (
        <CategoryPicker
          categories={categories}
          selected={formState.category}
          onSelect={handlers.handleCategoryChange}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}

      <ConfirmDialog />
    </div>
  )
}
