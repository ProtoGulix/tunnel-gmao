import { SearchBar } from '../ui/SearchBar'
import { ListStatus } from '../ui/ListStatus'
import { FilterChips } from '../ui/FilterChips'
import { StockItemCard } from './StockItemCard'

export function StockItemList({ items, loading, error, search, onSearchChange, searchOpen, facets, familyCode, onFamilyChange, subFamilyCode, onSubFamilyChange, onSelect }) {
  const selectedFamily = facets?.families?.find(f => f.code === familyCode)

  return (
    <>
      {searchOpen && (
        <SearchBar value={search} onChange={onSearchChange} placeholder="Nom, référence…" />
      )}

      {facets?.families?.length > 0 && (
        <FilterChips
          chips={facets.families.map(f => ({ key: f.code, label: f.label, count: f.count }))}
          active={familyCode || null}
          onChange={key => onFamilyChange(key ?? '')}
        />
      )}

      {selectedFamily?.sub_families?.length > 0 && (
        <FilterChips
          chips={selectedFamily.sub_families.map(sf => ({ key: sf.code, label: sf.label, count: sf.count }))}
          active={subFamilyCode || null}
          onChange={key => onSubFamilyChange(key ?? '')}
          color="#1F3A5F"
          allLabel="Toutes"
          className="py-2"
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <ListStatus
          loading={loading}
          error={error}
          empty={!loading && !error && items.length === 0}
          emptyMessage={s => s ? `Aucun résultat pour « ${s} »` : 'Aucun article en stock'}
          search={search}
        />
        {!loading && !error && items.length > 0 && (
          <div className="divide-y divide-[#E0E0E0] bg-white border-y border-[#E0E0E0] mt-3">
            {items.map(item => (
              <StockItemCard key={item.id} item={item} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
