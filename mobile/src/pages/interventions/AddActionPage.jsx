import { useParams, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useInterventionDetail } from '../../hooks/interventions/useInterventionDetail'
import { ActionForm } from '../../components/actions/ActionForm'

export default function AddActionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { intervention, loading } = useInterventionDetail(id)

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <Loader2 size={20} className="animate-spin text-tunnel-muted" />
    </div>
  )

  return (
    <ActionForm
      mode="page"
      defaultIntervention={intervention}
      actionDate={new Date().toISOString().slice(0, 10)}
      onClose={() => navigate(-1)}
      onDone={() => navigate(`/interventions/${id}`, { replace: true })}
    />
  )
}
