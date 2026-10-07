import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Loader2, Check, Unlink } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useInterventionDetail } from '../../hooks/interventions/useInterventionDetail'
import { changeInterventionStatus, getInterventionStatuses } from '../../api/interventions'
import { ActionCard } from '../planning/ActionCard'
import { ActionForm } from '../../components/actions/ActionForm'
import { InterventionTasksSection } from '../../components/interventions/InterventionTasksSection'
import { PurchaseRequestForm } from '../../components/purchases/PurchaseRequestForm'
import { BottomBar, BottomBtn } from '../../components/ui/BottomBar'
import { usePermissions } from '../../hooks/auth/usePermissions'
import { PERM } from '../../auth/permissionCodes'
import { formatDateFr } from '../../utils/dateUtils'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function DICard({ request }) {
  if (!request) {
    return (
      <div className="bg-white border border-tunnel-border rounded-lg p-4 flex items-start gap-3">
        <Unlink size={16} className="text-tunnel-muted shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-tunnel-text">Aucune demande liée</p>
          <p className="text-xs text-tunnel-muted mt-0.5">Intervention créée manuellement, sans demande associée.</p>
        </div>
      </div>
    )
  }
  const borderColor = request.statut_color ?? '#e2e8f0'
  return (
    <div
      className="bg-white border border-tunnel-border rounded-lg px-3 py-2.5 flex flex-col gap-1"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-xs font-semibold bg-tunnel-bg border border-tunnel-border text-tunnel-text px-1.5 py-0.5 rounded">
          {request.code}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: (request.statut_color ?? '#6b7280') + '22', color: request.statut_color ?? '#6b7280' }}
        >
          {request.statut_label}
        </span>
        <span className="text-xs font-semibold text-tunnel-text bg-tunnel-bg border border-tunnel-border px-1.5 py-0.5 rounded">
          {getInitials(request.demandeur_nom)}
        </span>
        <span className="text-xs text-tunnel-muted">—</span>
        {(request.service?.label ?? request.demandeur_service) && (
          <span className="text-xs text-tunnel-muted">{request.service?.label ?? request.demandeur_service}</span>
        )}
        {request.description && (
          <span className="text-xs text-tunnel-text truncate flex-1 min-w-0">{request.description}</span>
        )}
      </div>
      {request.created_at && (
        <p className="text-xs text-tunnel-muted text-right">{formatDateFr(request.created_at)}</p>
      )}
    </div>
  )
}

function StatusSheet({ currentCode, statuses, onClose, onChange }) {
  const targets = statuses.filter(s => s.id !== currentCode && (s.label || s.value))
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  async function handleChange(toCode) {
    setLoading(true)
    setErr(null)
    try {
      await onChange(toCode)
      onClose()
    } catch (e) {
      setErr(e?.data?.detail ?? e.message)
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.3)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl safe-bottom"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-tunnel-border rounded-full mx-auto mt-3 mb-4" />
        <div className="px-4 pb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-tunnel-muted mb-3">
            Changer le statut
          </p>
          {err && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{err}</div>
          )}
          {targets.length === 0 ? (
            <p className="text-sm text-tunnel-muted py-4 text-center">Aucun statut disponible</p>
          ) : (
            <div className="space-y-2 mb-4">
              {targets.map(s => {
                const displayLabel = s.label || s.value
                const color = s.color ?? '#6b7280'
                return (
                  <button
                    key={s.id}
                    disabled={loading}
                    onClick={() => handleChange(s.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-tunnel-border bg-white active:bg-tunnel-bg text-sm font-medium text-tunnel-text disabled:opacity-50"
                  >
                    <span>{displayLabel}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ backgroundColor: color + '22', color }}
                    >
                      {displayLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <button onClick={onClose} className="w-full py-3 text-sm text-tunnel-muted font-medium mb-2">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InterventionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { can } = usePermissions()
  const { intervention, loading, error, reload } = useInterventionDetail(id)
  const [statuses, setStatuses] = useState([])
  const [showStatusSheet, setShowStatusSheet] = useState(false)
  const [showActionForm, setShowActionForm] = useState(false)
  const [purchaseActionId, setPurchaseActionId] = useState(null)
  // Incrémenté à chaque reload() pour forcer InterventionTasksSection à
  // recharger — une action liée à une tâche fait passer celle-ci en
  // in_progress côté serveur (trigger DB), invisible sans ce signal car la
  // section a son propre state de tâches, indépendant de `intervention`.
  const [tasksRefreshKey, setTasksRefreshKey] = useState(0)
  const reloadAll = () => { reload(); setTasksRefreshKey(k => k + 1) }

  useEffect(() => {
    getInterventionStatuses().then(setStatuses).catch(() => {})
  }, [])

  const statusCode = intervention?.status_actual ?? intervention?.statut ?? ''
  const currentStatus = statuses.find(s => s.id === statusCode)
  const statusColor = currentStatus?.color
  const statusLabel = currentStatus?.label ?? currentStatus?.value ?? statusCode
  const eq = intervention?.equipements ?? intervention?.machine
  const actions = intervention?.actions ?? []
  const stats = intervention?.stats

  async function handleStatusChange(toCode) {
    await changeInterventionStatus({
      intervention_id: id,
      status_from: statusCode,
      status_to: toCode,  // toCode is now s.id (the backend identifier)
      technician_id: user?.id,
      date: new Date().toISOString(),
    })
    await reload()
  }

  return (
    <div className="flex flex-col h-full bg-tunnel-bg">
      {/* Header */}
      <header className="bg-white border-b border-tunnel-border shrink-0">
        <div className="flex items-center gap-2 px-2 pt-3 pb-2">
          <button onClick={() => navigate(-1)} className="p-2 text-tunnel-muted">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-tunnel-text truncate">
                {loading ? '…' : (intervention?.code ?? id)}
              </span>
              {statusLabel && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0"
                  style={statusColor
                    ? { backgroundColor: statusColor + '22', color: statusColor }
                    : { backgroundColor: '#6b728022', color: '#6b7280' }
                  }
                >
                  {statusLabel}
                </span>
              )}
            </div>
            {eq && (
              <p className="text-xs text-tunnel-muted truncate mt-0.5">
                <span className="font-mono">{eq.code}</span>
                {eq.name && <span> · {eq.name}</span>}
              </p>
            )}
          </div>
          {statusCode && statuses.length > 0 && can(PERM.intervention.changeStatus) && (
            <button
              onClick={() => setShowStatusSheet(true)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-tunnel-bg border border-tunnel-border text-tunnel-text mr-2"
            >
              Statut
            </button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex divide-x divide-tunnel-border border-t border-tunnel-border text-center">
            {[
              { label: 'Actions', value: stats.action_count ?? 0 },
              { label: 'Heures', value: stats.total_time ? `${stats.total_time}h` : '—' },
              { label: 'DA', value: stats.purchase_count ?? 0 },
            ].map(s => (
              <div key={s.label} className="flex-1 py-2">
                <p className="text-base font-semibold text-tunnel-text">{s.value}</p>
                <p className="text-[10px] text-tunnel-muted">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-tunnel-muted" />
          </div>
        )}

        {error && (
          <div className="m-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
        )}

        {!loading && intervention && (
          <>
            {/* Description */}
            {(intervention.description ?? intervention.title) && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-white border border-tunnel-border">
                <p className="text-xs font-medium uppercase tracking-wide text-tunnel-muted mb-1">Description</p>
                <p className="text-sm text-tunnel-text">{intervention.description ?? intervention.title}</p>
              </div>
            )}

            {/* Demande d'intervention liée */}
            <div className="mx-4 mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-tunnel-muted mb-2">Demande liée</p>
              <DICard request={intervention.request ?? null} />
            </div>

            {/* Tâches */}
            <InterventionTasksSection interventionId={id} refreshKey={tasksRefreshKey} />

            {/* Actions */}
            <div className="px-4 mt-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wide text-tunnel-muted">
                  Actions {actions.length > 0 && `(${actions.length})`}
                </p>
              </div>

              {actions.length === 0 ? (
                <p className="text-sm text-tunnel-muted text-center py-8">Aucune action enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {actions.map(action => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      variant="detail"
                      onAddPurchase={can(PERM.intervention.createPurchaseRequest) ? () => setPurchaseActionId(action.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* FAB bottom bar */}
      {!loading && intervention && can(PERM.intervention.addAction) && (
        <BottomBar>
          <BottomBtn variant="primary" onClick={() => setShowActionForm(true)} icon={<Plus size={16} />}>
            Ajouter une action
          </BottomBtn>
        </BottomBar>
      )}

      {showStatusSheet && (
        <StatusSheet
          currentCode={statusCode}
          statuses={statuses}
          onClose={() => setShowStatusSheet(false)}
          onChange={handleStatusChange}
        />
      )}

      {showActionForm && (
        <ActionForm
          onClose={() => setShowActionForm(false)}
          onDone={reloadAll}
          defaultEquip={eq}
          defaultIntervention={intervention}
        />
      )}

      {purchaseActionId != null && (
        <PurchaseRequestForm
          actionId={purchaseActionId}
          onClose={() => setPurchaseActionId(null)}
          onDone={reload}
        />
      )}
    </div>
  )
}
