/**
 * Vue tableau (master-detail) de l'onglet demandes d'achat — utilisée quand
 * l'utilisateur bascule hors de la vue pipeline par défaut.
 * @module components/purchase/tabs/PurchaseRequestsListView
 */
import { Button, Flex, Text } from '@radix-ui/themes';
import { ShoppingCart, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import { PurchaseRequestsTable, SortSelect } from './PurchaseRequestsTabParts';
import { PrFilters } from './PurchaseRequestsFilters';
import { DetailEmptyState } from './PurchaseRequestsDetailEmptyState';

export default function PurchaseRequestsListView({
  items, loading, search, setSearch,
  status, setStatus, statuses, urgency, setUrgency,
  sort, setSort, selectedId, onSelect,
  checkedIds, onToggleCheck, onToggleCheckAll, onBulkDeleteClick,
  detailContent, detailLoading,
}) {
  const masterList = items.length === 0 && !loading ? (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ height: 200, padding: 24 }}>
      <ShoppingCart size={28} color="var(--gray-7)" />
      <Text size="2" color="gray">Aucune demande d&apos;achat</Text>
    </Flex>
  ) : (
    <PurchaseRequestsTable
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      checkedIds={checkedIds}
      onToggleCheck={onToggleCheck}
      onToggleCheckAll={onToggleCheckAll}
      sort={sort}
      setSort={setSort}
    />
  );

  const headerExtra = (
    <Flex align="center" gap="2" wrap="wrap">
      <PrFilters status={status} setStatus={setStatus} statuses={statuses} urgency={urgency} setUrgency={setUrgency} />
      <SortSelect sort={sort} setSort={setSort} />
      {checkedIds.size > 0 && (
        <Button size="1" color="red" variant="soft" onClick={onBulkDeleteClick}>
          <Trash2 size={12} /> Supprimer ({checkedIds.size})
        </Button>
      )}
    </Flex>
  );

  return (
    <div style={{ flex: 1, minHeight: 0 }}>
      <MasterDetailLayout
        freeDetail
        ratio="55% 1fr"
        masterProps={{ count: items.length, search, onSearchChange: setSearch, loading, children: masterList, headerExtra }}
        detailChildren={detailContent ?? <DetailEmptyState label="Aucune demande sélectionnée" />}
        detailLoading={detailLoading}
      />
    </div>
  );
}

PurchaseRequestsListView.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  search: PropTypes.string,
  setSearch: PropTypes.func.isRequired,
  status: PropTypes.string,
  setStatus: PropTypes.func.isRequired,
  statuses: PropTypes.array.isRequired,
  urgency: PropTypes.string,
  setUrgency: PropTypes.func.isRequired,
  sort: PropTypes.string.isRequired,
  setSort: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  checkedIds: PropTypes.instanceOf(Set).isRequired,
  onToggleCheck: PropTypes.func.isRequired,
  onToggleCheckAll: PropTypes.func.isRequired,
  onBulkDeleteClick: PropTypes.func.isRequired,
  detailContent: PropTypes.node,
  detailLoading: PropTypes.bool,
};
