/**
 * DataList TUNNEL GMAO
 * Équivalent mobile de DataTable — liste verticale d'items
 * renderItem : (item, index) => ReactNode
 */
export function DataList({ items, renderItem, className = '' }) {
  return (
    <div className={`flex flex-col divide-y divide-tunnel-border ${className}`}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  )
}
