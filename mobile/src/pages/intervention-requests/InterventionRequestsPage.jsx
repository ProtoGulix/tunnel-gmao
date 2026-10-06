import { useState, useEffect } from 'react'
import { Plus, User, Briefcase, FileText, Hash, Calendar, ChevronRight, Link2, Loader2, Wrench } from 'lucide-react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { DIList } from '../../components/interventions/DIList'
import { DIForm } from '../../components/interventions/DIForm'
import { InterventionForm } from '../../components/interventions/InterventionForm'
import { ListStatus } from '../../components/ui/ListStatus'
import { SectionTitle, InfoRow } from '../../components/ui/DetailRows'
import { DynBadge } from '../../components/ui/DynBadge'
import { BottomBar, BottomBtn } from '../../components/ui/BottomBar'
import { useInterventionRequests } from '../../hooks/interventions/useInterventionRequests'
import { useInterventionRequestDetail } from '../../hooks/interventions/useInterventionRequestDetail'
import { transitionInterventionRequest, getIntervention } from '../../api/interventions'
import { INTERVENTION_STATUSES } from '../../config/badges'
import { formatDateFr } from '../../utils/dateUtils'

// Transitions autorisées par statut
const ALLOWED_TRANSITIONS = {
  nouvelle:   ['en_attente', 'acceptee', 'rejetee'],
  en_attente: ['acceptee', 'rejetee'],
  acceptee:   ['cloturee'],
}

// ── Historique des statuts ────────────────────────────────────────────────────
const StatusLogEntry = ({ entry, isLast }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
        style={{ backgroundColor: entry.status_to_color ?? '#6B7280' }} />
      {!isLast && <div className="w-0.5 flex-1 bg-[#E0E0E0] mt-1" />}
    </div>
    <div className="flex-1 min-w-0 pb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <DynBadge color={entry.status_to_color ?? '#6B7280'}>{entry.status_to_label}</DynBadge>
        {entry.status_from_label && (
          <span className="text-[11px] text-[#909090]">depuis {entry.status_from_label}</span>
        )}
      </div>
      {entry.notes && <p className="text-xs text-[#616161] mt-1 italic">« {entry.notes} »</p>}
      <p className="text-[11px] text-[#909090] mt-0.5">{formatDateFr(entry.date)}</p>
    </div>
  </div>
)

// ── Carte intervention liée ────────────────────────────────────────────────────
const LinkedIntervention = ({ interventionId, onNavigate }) => {
  const [inter, setInter] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getIntervention(interventionId)
      .then(setInter)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [interventionId])

  if (loading) return (
    <div className="bg-white px-4 py-3 flex items-center gap-2 text-sm text-[#616161]">
      <Loader2 size={14} className="animate-spin" />
      Chargement…
    </div>
  )
  if (!inter) return null

  const sc = INTERVENTION_STATUSES[inter.status_actual]?.color ?? '#616161'
  const sl = INTERVENTION_STATUSES[inter.status_actual]?.label ?? inter.status_actual

  return (
    <button
      onClick={() => onNavigate(inter.id)}
      className="w-full bg-white flex overflow-hidden active:opacity-75 transition-opacity"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.07)' }}
    >
      <div className="w-1 shrink-0" style={{ backgroundColor: sc }} />
      <div className="flex-1 min-w-0 px-3 py-2.5 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#1F3A5F18', color: '#1F3A5F' }}>
            {inter.code}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{ backgroundColor: sc + '18', color: sc }}>
            {sl}
          </span>
          {inter.type_inter && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ backgroundColor: '#ED6C0222', color: '#ED6C02' }}>
              {inter.type_inter}
            </span>
          )}
          <ChevronRight size={13} className="text-[#BDBDBD] shrink-0 ml-auto" />
        </div>
        {inter.title && <p className="text-sm text-[#2E2E2E] truncate">{inter.title}</p>}
      </div>
    </button>
  )
}

// ── Acceptation DI — wrapper API autour d'InterventionForm ───────────────────
const AcceptDISheet = ({ item, onClose, onDone }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      await transitionInterventionRequest(item.id, { status_to: 'acceptee', ...data })
      onDone()
    } catch (err) {
      setError(err?.data?.detail ?? err.message)
      setLoading(false)
    }
  }

  return (
    <InterventionForm
      di={{ id: item.id, code: item.code, description: item.description }}
      onSubmit={handleSubmit}
      onCancel={onClose}
      loading={loading}
      error={error}
    />
  )
}

// ── Détail d'une demande ──────────────────────────────────────────────────────
const DIDetail = ({ id, onNavigateIntervention }) => {
  const { item, loading, error, reload } = useInterventionRequestDetail(id)
  const [showAcceptForm, setShowAcceptForm] = useState(false)

  if (loading || error || !item) return (
    <div className="flex-1">
      <ListStatus loading={loading} error={error} empty={!loading && !error && !item} emptyMessage="Demande introuvable" />
    </div>
  )

  const eq = item.equipement
  const canAccept = ALLOWED_TRANSITIONS[item.statut]?.includes('acceptee') && !item.intervention_id
  const hasIntervention = !!item.intervention_id

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">

        {/* Bandeau statut */}
        <div className="px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: (item.statut_color ?? '#6B7280') + '18' }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: item.statut_color ?? '#6B7280' }}>
              {item.statut_label}
            </p>
            {item.code && (
              <p className="text-xs mt-0.5 font-mono" style={{ color: (item.statut_color ?? '#6B7280') + 'CC' }}>
                {item.code}
              </p>
            )}
          </div>
          {hasIntervention && (
            <DynBadge color="#10B981"><Link2 size={10} />Intervention liée</DynBadge>
          )}
        </div>

        {/* Infos principales */}
        <div className="bg-white mt-2 px-4">
          <InfoRow icon={FileText}  label="Description"  value={item.description} />
          <InfoRow icon={User}      label="Demandeur"    value={item.demandeur_nom} />
          <InfoRow icon={Briefcase} label="Service"      value={item.service?.label ?? item.demandeur_service} />
          <InfoRow icon={Calendar}  label="Créée le"     value={formatDateFr(item.created_at)} />
          {item.updated_at !== item.created_at && (
            <InfoRow icon={Calendar} label="Mise à jour" value={formatDateFr(item.updated_at)} />
          )}
        </div>

        {/* Équipement concerné */}
        {eq && (
          <div className="mt-2">
            <SectionTitle>Équipement</SectionTitle>
            <div className="bg-white px-4">
              <InfoRow icon={Hash}     label="Code"   value={eq.code} />
              <InfoRow icon={FileText} label="Nom"    value={eq.name} />
              {eq.equipement_class && (
                <InfoRow icon={Hash} label="Classe" value={eq.equipement_class.label} />
              )}
            </div>
          </div>
        )}

        {/* Intervention liée */}
        {hasIntervention && (
          <div className="mt-2">
            <SectionTitle>Intervention liée</SectionTitle>
            <LinkedIntervention
              interventionId={item.intervention_id}
              onNavigate={onNavigateIntervention}
            />
          </div>
        )}

        {/* Historique */}
        {item.status_log?.length > 0 && (
          <div className="mt-2 mb-4">
            <SectionTitle>Historique ({item.status_log.length})</SectionTitle>
            <div className="bg-white px-4 pt-4">
              {item.status_log.map((entry, i) => (
                <StatusLogEntry
                  key={entry.id}
                  entry={entry}
                  isLast={i === item.status_log.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BottomBar */}
      {(canAccept || hasIntervention) && (
        <BottomBar>
          {canAccept && (
            <BottomBtn
              variant="primary"
              icon={<Wrench size={16} />}
              onClick={() => setShowAcceptForm(true)}
            >
              Créer l'intervention
            </BottomBtn>
          )}
          {hasIntervention && (
            <BottomBtn
              variant={canAccept ? 'secondary' : 'primary'}
              icon={<ChevronRight size={16} />}
              onClick={() => onNavigateIntervention(item.intervention_id)}
            >
              Voir l'intervention
            </BottomBtn>
          )}
        </BottomBar>
      )}

      {showAcceptForm && (
        <AcceptDISheet
          item={item}
          onClose={() => setShowAcceptForm(false)}
          onDone={() => { setShowAcceptForm(false); reload() }}
        />
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function InterventionRequestsPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)

  const activeFilter = searchParams.get('statut') ?? 'nouvelle'
  const setActiveFilter = (code) => setSearchParams({ statut: code }, { replace: true })

  const { items, facets, loading, error, create, createStatus } = useInterventionRequests(
    activeFilter ? { statut: activeFilter } : {}
  )

  const handleCreate = async (data) => {
    await create(data)
    setShowForm(false)
  }

  // ── Vue détail ──
  if (requestId) {
    return (
      <div className="flex flex-col h-full bg-[#F4F6F8]">
        <PageHeader
          title="Détail demande"
          onBack={() => navigate('/intervention-requests')}
        />
        <DIDetail
          id={requestId}
          onNavigateIntervention={id => navigate(`/interventions/${id}`)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">
      <PageHeader title="Demandes d'intervention" />

      {facets.length > 0 && (
        <div className="flex gap-1 px-4 py-3 bg-white border-b border-[#E0E0E0] overflow-x-auto shrink-0">
          {facets.map(f => (
            <button
              key={f.code}
              onClick={() => setActiveFilter(f.code)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors border ${
                activeFilter === f.code
                  ? 'text-white border-transparent'
                  : 'text-[#616161] bg-[#F4F6F8] border-[#E0E0E0]'
              }`}
              style={activeFilter === f.code ? { backgroundColor: f.color, borderColor: f.color } : {}}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] ${activeFilter === f.code ? 'opacity-80' : 'text-[#616161]'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <DIList
          items={items}
          loading={loading}
          error={error}
          onSelect={id => navigate(`/intervention-requests/${id}`)}
        />
      </div>

      <BottomBar>
        <BottomBtn variant="primary" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
          Nouvelle demande
        </BottomBtn>
      </BottomBar>

      {showForm && (
        <DIForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          status={createStatus.status}
          error={createStatus.error}
        />
      )}
    </div>
  )
}
