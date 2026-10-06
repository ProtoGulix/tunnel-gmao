import { useState, useEffect } from 'react'
import { Check, Loader2, FileText, Wrench } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { SelectionChip } from '../ui/AsyncSearchSelect'
import { BottomBar, BottomBtn } from '../ui/BottomBar'
import { SheetPicker } from '../ui/SheetPicker'
import { getInterventionTypes } from '../../api/planning'

const inputCls = 'w-full border border-tunnel-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tunnel-accent/30 focus:border-tunnel-accent'
const labelCls = 'flex items-center gap-1.5 mb-1.5'

const PRIORITY_OPTIONS = [
  { value: 'faible',    label: 'Faible' },
  { value: 'normale',   label: 'Normale' },
  { value: 'important', label: 'Important' },
  { value: 'urgent',    label: 'Urgent' },
]

/**
 * InterventionForm — formulaire fullscreen de création d'intervention.
 *
 * Props :
 *   di             — DI liée pré-fixée (optionnel) : { id, code, description }
 *   onSubmit(data) — appelé avec { type_inter, tech_initials, title, priority, reported_date }
 *                    le parent est responsable de l'appel API
 *   onCancel
 *   loading        — spinner sur le bouton Créer
 *   error          — message d'erreur à afficher
 */
export function InterventionForm({ di = null, onSubmit, onCancel, loading = false, error = null }) {
  const { user } = useAuth()
  const [typeOptions, setTypeOptions] = useState([])
  const [typeInter, setTypeInter] = useState('')
  const [priority, setPriority] = useState('normale')
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState(di?.description ?? '')

  const techInitials = user?.initial
    ?? (user ? `${(user.first_name ?? '')[0] ?? ''}${(user.last_name ?? '')[0] ?? ''}`.toUpperCase() : '')

  useEffect(() => {
    getInterventionTypes()
      .then(types => {
        setTypeOptions(types)
        if (types.length > 0) setTypeInter(String(types[0].id))
      })
      .catch(() => {})
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      type_inter: typeInter,
      tech_initials: techInitials,
      title: title.trim() || undefined,
      priority,
      reported_date: reportedDate || undefined,
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
          <h2 className="text-sm font-bold text-tunnel-text">Nouvelle intervention</h2>
          {di && <p className="text-xs text-tunnel-muted truncate">Liée à {di.code}</p>}
        </div>
      </div>

      {/* Corps scrollable */}
      <form id="intervention-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">

          {/* Erreur */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-700">• {error}</p>
            </div>
          )}

          {/* DI liée — chip verrouillée */}
          {di && (
            <div>
              <div className={labelCls}>
                <FileText size={14} className="text-tunnel-muted" />
                <span className="text-xs font-bold text-tunnel-text">Demande d'intervention</span>
              </div>
              <SelectionChip
                badge={di.code}
                label={di.description}
                locked={true}
              />
            </div>
          )}

          {/* Titre */}
          <div>
            <div className={labelCls}>
              <span className="text-xs font-bold text-tunnel-text">Titre</span>
            </div>
            <input
              className={inputCls}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titre de l'intervention"
            />
          </div>

          {/* Type + Priorité */}
          <div className="flex gap-3">
            <div className="flex-1">
              <div className={labelCls}>
                <span className="text-xs font-bold text-tunnel-text">Type *</span>
              </div>
              <SheetPicker
                title="Type d'intervention"
                options={typeOptions.map(o => ({ value: String(o.id), label: o.title ?? o.label ?? o.code }))}
                value={typeInter}
                onChange={setTypeInter}
                placeholder="Sélectionner…"
                zIndex={70}
              />
            </div>
            <div className="flex-1">
              <div className={labelCls}>
                <span className="text-xs font-bold text-tunnel-text">Priorité</span>
              </div>
              <SheetPicker
                title="Priorité"
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={setPriority}
                placeholder="Normale"
                zIndex={70}
              />
            </div>
          </div>

          {/* Date de signalement */}
          <div>
            <div className={labelCls}>
              <span className="text-xs font-bold text-tunnel-text">Date de signalement</span>
            </div>
            <input
              type="date"
              className={inputCls}
              value={reportedDate}
              onChange={e => setReportedDate(e.target.value)}
            />
          </div>

          {/* Initiales */}
          <div>
            <div className={labelCls}>
              <span className="text-xs font-bold text-tunnel-text">Technicien</span>
            </div>
            <input
              className={inputCls + ' font-mono uppercase'}
              value={techInitials}
              readOnly
              placeholder="—"
            />
            <p className="text-[11px] text-tunnel-muted mt-1">Initiales issues de votre profil</p>
          </div>

        </div>
      </form>

      {/* Footer */}
      <BottomBar safeBottom={false}>
        <BottomBtn variant="secondary" type="button" onClick={onCancel}>Annuler</BottomBtn>
        <BottomBtn
          variant="primary"
          type="submit"
          form="intervention-form"
          disabled={loading}
          loading={loading}
          icon={<Check size={14} />}
        >
          Créer
        </BottomBtn>
      </BottomBar>
    </div>
  )
}
