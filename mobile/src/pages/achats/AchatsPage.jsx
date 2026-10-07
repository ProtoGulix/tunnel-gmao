import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DAList } from '../../components/achats/DAList'
import { PurchaseRequestForm } from '../../components/purchases/PurchaseRequestForm'
import { usePurchaseRequests } from '../../hooks/achats/usePurchaseRequests'
import { usePermissions } from '../../hooks/auth/usePermissions'
import { PERM } from '../../auth/permissionCodes'

export default function AchatsPage() {
  const { can } = usePermissions()
  const [showForm, setShowForm] = useState(false)
  const { items, loading, error, reload } = usePurchaseRequests()

  return (
    <div>
      <PageHeader
        title="Demandes d'achat"
        action={can(PERM.purchases.create) ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-tunnel-accent text-white px-3 py-1.5 rounded-lg text-xs font-medium"
          >
            <Plus size={14} />
            Nouvelle
          </button>
        ) : undefined}
      />
      <DAList items={items} loading={loading} error={error} />

      {showForm && (
        <PurchaseRequestForm
          onClose={() => setShowForm(false)}
          onDone={reload}
        />
      )}
    </div>
  )
}
