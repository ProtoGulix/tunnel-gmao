import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { ListStatus } from '../../components/ui/ListStatus'
import { ListRow } from '../../components/ui/ListRow'
import { SectionTitle } from '../../components/ui/DetailRows'
import { usePreventiveSchedule } from '../../hooks/preventive/usePreventiveSchedule'
import { formatDayFr } from '../../utils/dateUtils'
import { colors } from '../../config/colors'

// Même destination que la cloche : intervention, sinon demande, sinon rien (pas encore générée).
function planRoute(row) {
  if (row.intervention_id) return `/interventions/${row.intervention_id}`
  if (row.di_id) return `/intervention-requests/${row.di_id}`
  return null
}

function overdueText(days) {
  if (!days) return null
  return days === 1 ? '1 jour de retard' : `${days} jours de retard`
}

function PlanRow({ row, accentColor, onOpen }) {
  const route = planRoute(row)
  const late = overdueText(row.days_overdue)
  return (
    <ListRow accentColor={accentColor} chevron={!!route} onClick={() => route && onOpen(route)}>
      <p className="text-sm font-semibold text-tunnel-text">{row.plan_label}</p>
      <p className="text-xs text-tunnel-secondary">
        <span className="font-mono">{row.machine_code}</span> {row.machine_name}
      </p>
      <p className="text-xs text-tunnel-secondary">
        Échéance {formatDayFr(row.due_date)}
        {late && <span className="font-semibold text-tunnel-danger"> · {late}</span>}
        {!route && ' · pas encore générée'}
      </p>
    </ListRow>
  )
}

function Group({ title, rows, accentColor, onOpen }) {
  if (rows.length === 0) return null
  return (
    <section>
      <SectionTitle>{title} ({rows.length})</SectionTitle>
      <div className="flex flex-col gap-3 px-4 pb-4">
        {rows.map((r) => (
          <PlanRow key={`${r.plan_id}-${r.machine_id}`} row={r} accentColor={accentColor} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}

export default function PreventivePage() {
  const navigate = useNavigate()
  const { overdue, dueSoon, loading, error } = usePreventiveSchedule()

  return (
    <div className="flex flex-col h-full bg-tunnel-bg">
      <PageHeader title="Préventif à faire" onBack={() => navigate('/')} />
      <div className="flex-1 overflow-y-auto">
        <ListStatus
          loading={loading}
          error={error}
          empty={!loading && !error && overdue.length === 0 && dueSoon.length === 0}
          emptyMessage="Rien à faire cette semaine"
        />
        <Group title="En retard" rows={overdue} accentColor={colors.danger} onOpen={navigate} />
        <Group title="Cette semaine" rows={dueSoon} accentColor={colors.warning} onOpen={navigate} />
      </div>
    </div>
  )
}
