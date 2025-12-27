import { Fragment, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Table, Flex, Text, Badge, Card, Button } from "@radix-ui/themes";
import { Package, CheckCircle, FileText, AlertCircle, Star, ChevronUp, ChevronDown } from "lucide-react";
import ToggleDetailsButton from "@/components/common/ToggleDetailsButton";
import EditStockItemDialog from "./EditStockItemDialog";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import StandardSpecsPanel from "./StandardSpecsPanel";
import SupplierRefsInlinePanel from "./SupplierRefsInlinePanel";
import ManufacturerBadge from "@/components/common/ManufacturerBadge";

/**
 * Table d'affichage des articles du stock avec expansion inline
 * Affiche référence, nom, famille, stock, spécifications et références fournisseurs
 * 
 * ✅ Implémenté :
 * - Tri cliquable sur 4 colonnes (référence, nom, famille, stock) avec chevrons
 * - Expansion inline exclusive (specs OU refs)
 * - Mode compact optionnel
 * - Sticky header pour navigation fluide
 * 
 * TODO: Améliorations futures possibles :
 * - Virtualisation (react-window/react-virtual) si >100 items pour performances
 * - Filtres inline par famille/stock/spécs avec chips
 * - Pagination si dataset très large (>500 items)
 * - Sélection multiple avec checkboxes pour actions en batch
 * - Export CSV/Excel des données affichées
 * - Recherche globale dans la table
 * - Mémorisation du tri dans localStorage
 */
export default function StockItemsTable({
  items,
  compactRows,
  specsCounts = {},
  specsHasDefault = {},
  supplierRefsCounts = {},
  onEditStockItem,
  suppliers,
  refs,
  formData,
  setFormData,
  onAdd,
  onUpdatePreferred,
  onDelete,
  loading,
  showStockCol = true,
}) {
  // États internes pour l'expansion des lignes
  const [expandedSpecsItemId, setExpandedSpecsItemId] = useState(null);
  const [expandedStockItemId, setExpandedStockItemId] = useState(null);

  // État pour le tri des colonnes
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });

  // TODO: Considérer useMemo pour mémoïser le filtrage si refs est très large
  const getItemRefs = useCallback((itemId) => {
    if (Array.isArray(refs)) {
      return refs.filter((r) => {
        const sid = typeof r.stockItemId === "object" ? r.stockItemId?.id : r.stockItemId;
        return String(sid) === String(itemId);
      });
    }
    return refs?.[itemId] || [];
  }, [refs]);

  // Mémoïser le calcul du colspan pour éviter recalculs inutiles
  const colSpan = useMemo(() => showStockCol ? 7 : 6, [showStockCol]);

  // Fonction de tri des colonnes
  const handleSort = useCallback((column) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Trier les items selon la configuration de tri
  const sortedItems = useMemo(() => {
    if (!sortConfig.column) return items;

    return [...items].sort((a, b) => {
          let aValue, bValue;
    
          switch (sortConfig.column) {
            case 'ref':
              aValue = a.ref || '';
              bValue = b.ref || '';
              break;
            case 'name':
              aValue = a.name || '';
              bValue = b.name || '';
              break;
            case 'family':
              aValue = a.family_code || '';
              bValue = b.family_code || '';
              break;
            case 'stock':
              aValue = a.quantity || 0;
              bValue = b.quantity || 0;
              return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            default:
              return 0;
          }
    
          const comparison = aValue.toString().localeCompare(bValue.toString(), 'fr', { numeric: true });
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
  }, [items, sortConfig]);

  // TODO: Si items.length > 100, implémenter virtualisation avec react-window
  // const Row = ({ index, style }) => { const item = items[index]; return (...); };
  // <FixedSizeList height={600} itemCount={items.length} itemSize={50}>{Row}</FixedSizeList>

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Table.Root size={compactRows ? "1" : "2"}>
          <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--gray-1)', zIndex: 1 }}>
            <Table.Row>
              <Table.ColumnHeaderCell
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('ref')}
              >
                <Flex align="center" gap="1">
                  Référence
                  {sortConfig.column === 'ref' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('name')}
              >
                <Flex align="center" gap="1">
                  Nom
                  {sortConfig.column === 'name' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('family')}
              >
                <Flex align="center" gap="1">
                  Famille
                  {sortConfig.column === 'family' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </Flex>
              </Table.ColumnHeaderCell>
              {showStockCol && (
                <Table.ColumnHeaderCell
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('stock')}
                >
                  <Flex align="center" gap="1">
                    Stock
                    {sortConfig.column === 'stock' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </Flex>
                </Table.ColumnHeaderCell>
              )}
              <Table.ColumnHeaderCell>Spécs</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Références</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortedItems.map((item) => (
              <Fragment key={item.id}>
                <Table.Row>
                  <Table.Cell>
                    <Text size="2" weight="bold">{item.ref}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{item.name}</Text>
                    <ManufacturerBadge
                      name={item?.manufacturer_item_id?.manufacturer_name}
                      reference={item?.manufacturer_item_id?.manufacturer_ref}
                      designation={item?.manufacturer_item_id?.designation}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="soft">{item.family_code}</Badge>
                  </Table.Cell>
                  {showStockCol && (
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <Package size={14} color="var(--gray-9)" />
                        <Text weight="bold">{item.quantity || 0}</Text>
                        <Badge color="gray" variant="soft" size="1">{item.unit || "pcs"}</Badge>
                      </Flex>
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      <Button
                        size="1"
                        variant="soft"
                        color={expandedSpecsItemId === item.id ? "blue" : "gray"}
                        onClick={() => {
                          setExpandedSpecsItemId(expandedSpecsItemId === item.id ? null : item.id);
                          setExpandedStockItemId(null);
                        }}
                        aria-expanded={expandedSpecsItemId === item.id}
                        aria-label={expandedSpecsItemId === item.id ? `Masquer les spécifications de ${item.name}` : `Afficher les spécifications de ${item.name}`}
                      >
                        <FileText size={14} />
                      </Button>
                      <Badge color={(specsCounts[item.id] || 0) > 0 ? "green" : "gray"} variant="outline" size="1">
                        {specsCounts[item.id] || 0}
                      </Badge>
                      {specsHasDefault[item.id] && (
                        <CheckCircle size={14} color="var(--green-9)" />
                      )}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      {(supplierRefsCounts[item.id] || 0) === 0 ? (
                        <Flex align="center" gap="1" title="Aucune référence fournisseur">
                          <AlertCircle size={16} color="var(--amber-9)" />
                          <Badge color="amber" variant="soft">0</Badge>
                        </Flex>
                      ) : (
                        <Flex align="center" gap="1">
                          {/* Check if item has a preferred ref */}
                          {getItemRefs(item.id).some((r) => r.isPreferred) && (
                            <Star size={14} color="var(--amber-9)" fill="var(--amber-9)" title="Référence préférée définie" />
                          )}
                          <Badge color="blue" variant="outline">{supplierRefsCounts[item.id] || 0}</Badge>
                        </Flex>
                      )}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap="1">
                      <EditStockItemDialog item={item} onSave={onEditStockItem} loading={loading} />
                      <ToggleDetailsButton
                        isExpanded={expandedStockItemId === item.id}
                        onToggle={() => {
                          setExpandedStockItemId(expandedStockItemId === item.id ? null : item.id);
                          if (expandedStockItemId !== item.id) {
                            setExpandedSpecsItemId(null);
                          }
                        }}
                        label={expandedStockItemId === item.id ? `Masquer les références fournisseurs de ${item.name}` : `Afficher les références fournisseurs de ${item.name}`}
                      />
                    </Flex>
                  </Table.Cell>
                </Table.Row>
                {expandedSpecsItemId === item.id && (
                  <ExpandableDetailsRow colSpan={colSpan} withCard={false}>
                    <StandardSpecsPanel stockItemId={item.id} stockItemName={item.name} />
                  </ExpandableDetailsRow>
                )}
                {expandedStockItemId === item.id && (
                  <ExpandableDetailsRow colSpan={colSpan} withCard={false}>
                    <SupplierRefsInlinePanel
                      stockItem={item}
                      suppliers={suppliers}
                      refs={getItemRefs(item.id)}
                      formData={formData}
                      setFormData={setFormData}
                      onAdd={onAdd}
                      onUpdatePreferred={(refId, updates) => onUpdatePreferred(refId, updates, item.id)}
                      onDelete={(refId) => onDelete(refId, item.id)}
                      loading={loading}
                    />
                  </ExpandableDetailsRow>
                )}
              </Fragment>
            ))}
          </Table.Body>
        </Table.Root>
      </Flex>
    </Card>
  );
}

StockItemsTable.propTypes = {
  items: PropTypes.array.isRequired,
  compactRows: PropTypes.bool,
  specsCounts: PropTypes.object,
  specsHasDefault: PropTypes.object,
  supplierRefsCounts: PropTypes.object,
  onEditStockItem: PropTypes.func.isRequired,
  suppliers: PropTypes.array,
  refs: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  formData: PropTypes.object,
  setFormData: PropTypes.func,
  onAdd: PropTypes.func,
  onUpdatePreferred: PropTypes.func,
  onDelete: PropTypes.func,
  loading: PropTypes.bool,
  showStockCol: PropTypes.bool,
};
