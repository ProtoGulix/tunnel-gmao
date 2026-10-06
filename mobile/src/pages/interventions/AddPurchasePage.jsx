import { useNavigate, useLocation } from 'react-router-dom'
import { PurchaseRequestForm } from '../../components/purchases/PurchaseRequestForm'

export default function AddPurchasePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const actionId = location.state?.actionId

  return (
    <PurchaseRequestForm
      actionId={actionId}
      onClose={() => navigate(-1)}
      onDone={() => {}}
    />
  )
}
