import { useState } from 'react'
import { Package, ShoppingCart, Plus } from 'lucide-react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { DAList } from '../../components/achats/DAList'
import { PurchaseRequestForm } from '../../components/purchases/PurchaseRequestForm'
import { usePurchaseRequests } from '../../hooks/achats/usePurchaseRequests'
import { BottomBar, BottomBtn } from '../../components/ui/BottomBar'
import { PageHeader } from '../../components/ui/PageHeader'
import { StockItemList } from '../../components/stock/StockItemList'
import { StockItemDetail } from '../../components/stock/StockItemDetail'
import { useStockItems } from '../../hooks/stock/useStockItems'

const TABS = [
  { key: 'stock',  label: 'Stock',            icon: Package },
  { key: 'achats', label: "Demandes d'achat", icon: ShoppingCart },
]

function TabBar({ active, onChange }) {
  return TABS.map(({ key, label, icon: Icon }) => (
    <button
      key={key}
      onClick={() => onChange(key)}
      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
        active === key ? 'border-[#1F3A5F] text-[#1F3A5F]' : 'border-transparent text-[#616161]'
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  ))
}

// ── Vue Demandes d'achat ──────────────────────────────────────────────────────
function AchatsView() {
  const [showForm, setShowForm] = useState(false)
  const { items, loading, error, reload } = usePurchaseRequests()

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <DAList items={items} loading={loading} error={error} />
      </div>
      <BottomBar>
        <BottomBtn variant="primary" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
          Nouvelle demande
        </BottomBtn>
      </BottomBar>
      {showForm && (
        <PurchaseRequestForm onClose={() => setShowForm(false)} onDone={reload} />
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function StockPage() {
  const { itemId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Onglet actif — persisté dans ?tab=
  const tab = TABS.some(t => t.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'stock'

  // Filtres — persistés dans ?family= et ?sub=
  const search      = searchParams.get('q') ?? ''
  const familyCode  = searchParams.get('family') ?? ''
  const subFamilyCode = searchParams.get('sub') ?? ''

  const [searchOpen, setSearchOpen] = useState(false)

  const { items, loading, error, facets } = useStockItems({ search, familyCode, subFamilyCode })

  const openPurchase = searchParams.get('purchase') === '1'

  // Helpers pour mettre à jour un param sans effacer les autres
  const setParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  const handleTabChange = (key) => {
    setSearchParams({ tab: key }, { replace: true })
    setSearchOpen(false)
  }

  const handleSelect = (id) => {
    navigate(`/stock/items/${id}`, { replace: false })
    setSearchOpen(false)
  }

  const handleBack = () => {
    navigate('/stock', { replace: false })
  }

  const handleFamilyChange = (code) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (code) next.set('family', code)
      else next.delete('family')
      next.delete('sub')
      return next
    }, { replace: true })
  }

  const handleSubFamilyChange = (code) => {
    setParam('sub', code)
  }

  const showSearch = tab === 'stock' && !itemId
  const title = itemId
    ? (items.find(i => i.id === itemId)?.name ?? '…')
    : 'Stock'

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">
      <PageHeader
        title={title}
        onBack={itemId ? handleBack : undefined}
        onSearch={showSearch ? () => setSearchOpen(s => !s) : undefined}
        searchActive={searchOpen}
        tabs={!itemId && <TabBar active={tab} onChange={handleTabChange} />}
      />

      {tab === 'stock' ? (
        itemId ? (
          <StockItemDetail id={itemId} openPurchaseOnMount={openPurchase} />
        ) : (
          <StockItemList
            items={items}
            loading={loading}
            error={error}
            search={search}
            onSearchChange={v => setParam('q', v)}
            searchOpen={searchOpen}
            facets={facets}
            familyCode={familyCode}
            onFamilyChange={handleFamilyChange}
            subFamilyCode={subFamilyCode}
            onSubFamilyChange={handleSubFamilyChange}
            onSelect={handleSelect}
          />
        )
      ) : (
        <AchatsView />
      )}
    </div>
  )
}
