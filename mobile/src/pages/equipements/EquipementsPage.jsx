import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, AlertTriangle, CheckCircle, AlertCircle, Cpu, Calendar, Hash, Tag, MapPin, Factory, FileText, QrCode } from 'lucide-react'
import { useEquipements } from '../../hooks/equipements/useEquipements'
import { useEquipementDetail } from '../../hooks/equipements/useEquipementDetail'
import { PageHeader } from '../../components/ui/PageHeader'
import { SearchBar } from '../../components/ui/SearchBar'
import { FilterChips } from '../../components/ui/FilterChips'
import { ListStatus } from '../../components/ui/ListStatus'
import { ListRow } from '../../components/ui/ListRow'
import { SectionTitle, InfoRow } from '../../components/ui/DetailRows'
import { DynBadge } from '../../components/ui/DynBadge'

// ── Health ────────────────────────────────────────────────────────────────────
const HEALTH_CONFIG = {
  ok:       { color: '#2E7D32', bg: '#2E7D3218', icon: CheckCircle,   label: 'OK' },
  warning:  { color: '#ED6C02', bg: '#ED6C0218', icon: AlertTriangle, label: 'Attention' },
  critical: { color: '#C62828', bg: '#C6282818', icon: AlertCircle,   label: 'Critique' },
}

const STATUS_COLOR = {
  ouvert: '#1F3A5F', en_cours: '#ED6C02', en_attente: '#ED6C02',
  attente_pieces: '#C62828', attente_prod: '#ED6C02', ferme: '#2E7D32', cancelled: '#616161',
}
const STATUS_LABEL = {
  ouvert: 'Ouvert', en_cours: 'En cours', en_attente: 'En attente',
  attente_pieces: 'Attente pièces', attente_prod: 'Attente prod', ferme: 'Fermé', cancelled: 'Annulé',
}
const PRIORITY_COLOR = { urgent: '#C62828', important: '#ED6C02', normale: '#1F3A5F', faible: '#616161' }
const PRIORITY_LABEL = { urgent: 'Urgent', important: 'Important', normale: 'Normale', faible: 'Faible' }

// ── Carte équipement ──────────────────────────────────────────────────────────
function EquipementCard({ item, onSelect }) {
  const cfg = HEALTH_CONFIG[item.health?.level] ?? HEALTH_CONFIG.ok
  const { health } = item

  return (
    <ListRow accentColor={cfg.color} onClick={() => onSelect(item.id)}>
      {/* Ligne 1 — code + classe + statut + santé */}
      <div className="flex items-center gap-2 flex-wrap">
        <DynBadge color="#1F3A5F" mono>{item.code}</DynBadge>
        {item.equipement_class && <DynBadge color="#616161">{item.equipement_class.label}</DynBadge>}
        {item.statut && <DynBadge color={item.statut.couleur ?? '#616161'}>{item.statut.label}</DynBadge>}
        {health && (
          <DynBadge color={cfg.color}>
            <cfg.icon size={11} />
            {cfg.label}
          </DynBadge>
        )}
      </div>

      {/* Ligne 2 — nom */}
      <p className="text-sm font-medium text-[#2E2E2E] leading-snug truncate">{item.name}</p>

      {/* Ligne 3 — compteurs interventions */}
      {health && (health.open_interventions_count > 0 || health.new_requests_count > 0) && (
        <div className="flex items-center gap-3 text-[11px] text-[#616161]">
          {health.open_interventions_count > 0 && (
            <span>{health.open_interventions_count} intervention{health.open_interventions_count > 1 ? 's' : ''} ouverte{health.open_interventions_count > 1 ? 's' : ''}</span>
          )}
          {health.urgent_count > 0 && (
            <span style={{ color: '#C62828' }}>{health.urgent_count} urgente{health.urgent_count > 1 ? 's' : ''}</span>
          )}
          {health.new_requests_count > 0 && (
            <span>{health.new_requests_count} demande{health.new_requests_count > 1 ? 's' : ''}</span>
          )}
        </div>
      )}
    </ListRow>
  )
}

// ── Détail équipement ─────────────────────────────────────────────────────────
function EquipementDetail({ uuid }) {
  const navigate = useNavigate()
  const { item, loading, error } = useEquipementDetail(uuid)

  if (loading || error || !item) return (
    <div className="flex-1">
      <ListStatus loading={loading} error={error} empty={!loading && !error && !item} emptyMessage="Équipement introuvable" />
    </div>
  )

  const { health } = item
  const cfg = HEALTH_CONFIG[health?.level] ?? HEALTH_CONFIG.ok
  const ARCHIVED = new Set(['ferme', 'cancelled'])
  const PRIORITY_ORDER = { urgent: 0, important: 1, normale: 2, faible: 3 }

  const activeInterventions = (item.interventions?.items ?? [])
    .filter(i => !ARCHIVED.has(i.status_actual))
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
  const archivedInterventions = (item.interventions?.items ?? [])
    .filter(i => ARCHIVED.has(i.status_actual))

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Bandeau santé */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: cfg.bg }}>
        <cfg.icon size={18} style={{ color: cfg.color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
          {health?.reason && <p className="text-xs mt-0.5" style={{ color: cfg.color + 'CC' }}>{health.reason}</p>}
        </div>
        {health && (health.open_interventions_count > 0 || health.urgent_count > 0) && (
          <div className="flex gap-2 shrink-0">
            {health.open_interventions_count > 0 && <DynBadge color={cfg.color}>{health.open_interventions_count} ouvertes</DynBadge>}
            {health.urgent_count > 0 && <DynBadge color="#C62828">{health.urgent_count} urgentes</DynBadge>}
          </div>
        )}
      </div>

      {/* Infos principales */}
      <div className="bg-white mt-2 px-4">
        <InfoRow icon={Hash}     label="Code"             value={item.code} />
        <InfoRow icon={Cpu}      label="Nom"              value={item.name} />
        <InfoRow icon={Tag}      label="Classe"           value={item.equipement_class?.label} />
        {item.statut && (
          <InfoRow icon={Tag} label="Statut">
            <DynBadge color={item.statut.couleur ?? '#616161'} size="sm">{item.statut.label}</DynBadge>
          </InfoRow>
        )}
        {item.parent && (
          <InfoRow icon={ChevronRight} label="Machine mère">
            <span className="text-sm text-[#2E2E2E]">
              <DynBadge color="#1F3A5F" mono className="mr-1.5">{item.parent.code}</DynBadge>
              {item.parent.name}
            </span>
          </InfoRow>
        )}
        <InfoRow icon={Hash}     label="N° machine"       value={item.no_machine} />
        <InfoRow icon={MapPin}   label="Affectation"      value={item.affectation} />
        <InfoRow icon={Factory}  label="Fabricant"        value={item.fabricant} />
        <InfoRow icon={Hash}     label="N° série"         value={item.numero_serie} />
        <InfoRow icon={Calendar} label="Mise en service"  value={item.date_mise_service} />
        <InfoRow icon={FileText} label="Notes"            value={item.notes} />
      </div>

      {/* UUID */}
      <div className="mt-2 bg-white px-4 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <QrCode size={13} className="text-[#909090]" />
          <span className="text-xs text-[#909090]">UUID (QR code)</span>
        </div>
        <p className="font-mono text-[11px] text-[#616161] break-all">{item.id}</p>
      </div>

      {/* Sous-équipements */}
      {item.children_count > 0 && (
        <div className="mt-2 bg-white px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-[#2E2E2E]">Sous-équipements</span>
          <DynBadge color="#1F3A5F" mono>{item.children_count}</DynBadge>
        </div>
      )}

      {/* Interventions liées */}
      {(activeInterventions.length > 0 || archivedInterventions.length > 0) && (
        <div className="mt-2">
          {activeInterventions.length > 0 && (
            <>
              <SectionTitle>Interventions ouvertes ({activeInterventions.length})</SectionTitle>
              <div className="bg-white">
                {activeInterventions.map(inter => (
                  <InterventionRow key={inter.id} inter={inter} onNavigate={id => navigate(`/interventions/${id}`)} />
                ))}
              </div>
            </>
          )}
          {archivedInterventions.length > 0 && (
            <>
              <SectionTitle>Archivées ({archivedInterventions.length})</SectionTitle>
              <div className="bg-white">
                {archivedInterventions.map(inter => (
                  <InterventionRow key={inter.id} inter={inter} faded onNavigate={id => navigate(`/interventions/${id}`)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function InterventionRow({ inter, faded = false, onNavigate }) {
  const ARCHIVED = new Set(['ferme', 'cancelled'])
  const sc = STATUS_COLOR[inter.status_actual] ?? '#616161'
  const pc = PRIORITY_COLOR[inter.priority] ?? '#616161'
  const isUrgent = inter.priority === 'urgent' && !ARCHIVED.has(inter.status_actual)

  return (
    <ListRow
      accentColor={isUrgent ? '#C62828' : sc}
      onClick={() => onNavigate(inter.id)}
      faded={faded}
      chevron={false}
      className="border-b border-[#F0F0F0]"
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-mono text-[11px] font-medium" style={{ color: '#1F3A5F' }}>{inter.code}</span>
        {inter.type_inter && <DynBadge color="#616161">{inter.type_inter.label ?? inter.type_inter.code}</DynBadge>}
        <DynBadge color={sc}>{STATUS_LABEL[inter.status_actual] ?? inter.status_actual}</DynBadge>
        {inter.priority && !ARCHIVED.has(inter.status_actual) && (
          <DynBadge color={pc}>{PRIORITY_LABEL[inter.priority] ?? inter.priority}</DynBadge>
        )}
        <ChevronRight size={14} className="text-[#909090] shrink-0 ml-auto" />
      </div>
      <p className="text-sm text-[#2E2E2E] truncate">{inter.title}</p>
    </ListRow>
  )
}

// ── Liste équipements ─────────────────────────────────────────────────────────
function EquipementsList({ onSelect, searchOpen, selectedClass, onClassChange, search, onSearchChange }) {
  const filters = selectedClass ? { select_class: selectedClass } : {}
  const { items, facets, loading, error } = useEquipements(filters, search)

  return (
    <>
      {searchOpen && (
        <SearchBar value={search} onChange={onSearchChange} placeholder="Code, nom, affectation…" />
      )}

      {facets.length > 0 && (
        <FilterChips
          chips={facets.map(f => ({ key: f.code ?? '__none__', label: f.label ?? 'Sans classe', count: f.count }))}
          active={selectedClass}
          onChange={key => onClassChange(key === '__none__' ? null : key)}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <ListStatus
          loading={loading}
          error={error}
          empty={!loading && !error && items.length === 0}
          emptyMessage={s => s ? `Aucun résultat pour « ${s} »` : 'Aucun équipement'}
          search={search}
        />
        {!loading && !error && items.length > 0 && (
          <div className="divide-y divide-[#E0E0E0] bg-white border-y border-[#E0E0E0] mt-3">
            {items.map(item => (
              <EquipementCard key={item.id} item={item} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function EquipementsPage() {
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchOpen, setSearchOpen] = useState(false)

  const selectedClass = searchParams.get('class') || null
  const search = searchParams.get('q') ?? ''

  const setParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  const handleSelect = (id) => {
    navigate(`/equipements/${id}`, { replace: false })
  }

  const handleBack = () => {
    setSearchOpen(false)
    navigate('/equipements', { replace: false })
  }

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">
      <PageHeader
        title={uuid ? 'Fiche équipement' : 'Équipements'}
        onBack={uuid ? handleBack : undefined}
        onSearch={uuid ? undefined : () => setSearchOpen(s => !s)}
        searchActive={searchOpen}
      />

      {uuid
        ? <EquipementDetail uuid={uuid} />
        : <EquipementsList
            onSelect={handleSelect}
            searchOpen={searchOpen}
            selectedClass={selectedClass}
            onClassChange={code => setParam('class', code)}
            search={search}
            onSearchChange={v => setParam('q', v)}
          />
      }
    </div>
  )
}
