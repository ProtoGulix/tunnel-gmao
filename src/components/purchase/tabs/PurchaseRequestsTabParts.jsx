/**
 * Sous-composants partagés pour les onglets demandes d'achat.
 * @module components/purchase/tabs/PurchaseRequestsTabParts
 */
import { Badge, Checkbox, Flex, Select, Table, Text } from '@radix-ui/themes';
import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import PropTypes from 'prop-types';
import { PURCHASE_URGENCY } from '@/config/purchaseConfig';
import HexBadge from '@/components/ui/HexBadge';

// ─── Tri ──────────────────────────────────────────────────────────────────────

const URGENCY_RANK = { critical: 3, high: 2, normal: 1 };

export const SORT_OPTIONS = [
  { value: 'age_desc', label: 'Plus ancien d’abord' },
  { value: 'age_asc', label: 'Plus récent d’abord' },
  { value: 'urgency_desc', label: 'Urgence décroissante' },
  { value: 'urgency_asc', label: 'Urgence croissante' },
];

export function sortItems(items, sort) {
  const sorted = [...items];
  switch (sort) {
    case 'age_asc':
      return sorted.sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));
    case 'urgency_desc':
      return sorted.sort((a, b) => (URGENCY_RANK[b.urgency] ?? 0) - (URGENCY_RANK[a.urgency] ?? 0));
    case 'urgency_asc':
      return sorted.sort((a, b) => (URGENCY_RANK[a.urgency] ?? 0) - (URGENCY_RANK[b.urgency] ?? 0));
    case 'age_desc':
    default:
      return sorted.sort((a, b) => new Date(a.created_at ?? 0) - new Date(b.created_at ?? 0));
  }
}

export function SortSelect({ sort, setSort }) {
  return (
    <Select.Root value={sort} onValueChange={setSort}>
      <Select.Trigger aria-label="Trier la liste" />
      <Select.Content>
        {SORT_OPTIONS.map((o) => (
          <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
SortSelect.propTypes = { sort: PropTypes.string.isRequired, setSort: PropTypes.func.isRequired };

// ─── Tableau liste ────────────────────────────────────────────────────────────

function SortableHeader({ label, sortKey, sort, setSort, ...props }) {
  const isAsc = sort === `${sortKey}_asc`;
  const isDesc = sort === `${sortKey}_desc`;
  const isActive = isAsc || isDesc;
  const nextSort = isDesc ? `${sortKey}_asc` : `${sortKey}_desc`;
  return (
    <Table.ColumnHeaderCell {...props}>
      <Flex
        align="center" gap="1"
        role="button" tabIndex={0}
        aria-label={`Trier par ${label}`}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setSort(nextSort)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSort(nextSort); } }}
      >
        <Text size="1" weight="bold" color={isActive ? undefined : 'gray'}>{label}</Text>
        {isActive && (isAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </Flex>
    </Table.ColumnHeaderCell>
  );
}
SortableHeader.propTypes = {
  label: PropTypes.string.isRequired,
  sortKey: PropTypes.string.isRequired,
  sort: PropTypes.string.isRequired,
  setSort: PropTypes.func.isRequired,
};

function RowCheckboxCell({ item, isChecked, onToggleCheck }) {
  return (
    <Table.Cell onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={isChecked}
        onCheckedChange={() => onToggleCheck(item.id)}
        aria-label={`Sélectionner ${item.code || item.item_label}`}
      />
    </Table.Cell>
  );
}
RowCheckboxCell.propTypes = {
  item: PropTypes.object.isRequired,
  isChecked: PropTypes.bool,
  onToggleCheck: PropTypes.func.isRequired,
};

function RowReferenceCell({ item }) {
  return (
    <Table.Cell>
      <Flex align="center" gap="1">
        {item.urgent && <AlertTriangle size={12} color="var(--red-9)" />}
        <Text size="2" weight="bold">{item.code || '—'}</Text>
      </Flex>
    </Table.Cell>
  );
}
RowReferenceCell.propTypes = { item: PropTypes.object.isRequired };

function formatRowDate(createdAt) {
  return createdAt
    ? new Date(createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
}

function PurchaseRequestTableRow({ item, isSelected, isChecked, onClick, onToggleCheck }) {
  const urgency = PURCHASE_URGENCY[item.urgency] ?? { label: 'Normal', color: 'gray' };
  const statusColor = item.derived_status?.color;
  const statusLabel = item.derived_status?.label;
  const demandeur = item.requested_by || item.requester_name;
  const dateStr = formatRowDate(item.created_at);

  return (
    <Table.Row
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onClick(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(item); } }}
      style={{ cursor: 'pointer', background: isSelected ? 'var(--accent-3)' : undefined }}
    >
      <RowCheckboxCell item={item} isChecked={isChecked} onToggleCheck={onToggleCheck} />
      <RowReferenceCell item={item} />
      <Table.Cell style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Text size="2">{item.item_label}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>{item.quantity} {item.unit || 'pcs'}</Text>
      </Table.Cell>
      <Table.Cell><Badge color={urgency.color} variant="soft" size="1">{urgency.label}</Badge></Table.Cell>
      <Table.Cell>{statusLabel && <HexBadge color={statusColor} label={statusLabel} />}</Table.Cell>
      <Table.Cell><Text size="1" color="gray">{demandeur ?? '—'}</Text></Table.Cell>
      <Table.Cell><Text size="1" color="gray">{dateStr ?? '—'}</Text></Table.Cell>
    </Table.Row>
  );
}
PurchaseRequestTableRow.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  isChecked: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onToggleCheck: PropTypes.func.isRequired,
};

export function PurchaseRequestsTable({
  items, selectedId, onSelect,
  checkedIds, onToggleCheck, onToggleCheckAll,
  sort, setSort,
}) {
  const allChecked = items.length > 0 && items.every((item) => checkedIds.has(item.id));
  const someChecked = items.some((item) => checkedIds.has(item.id));

  return (
    <Table.Root size="1" variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>
            <Checkbox
              checked={allChecked ? true : (someChecked ? 'indeterminate' : false)}
              onCheckedChange={() => onToggleCheckAll(items)}
              aria-label="Sélectionner toutes les demandes visibles"
            />
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Désignation</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
          <SortableHeader label="Urgence" sortKey="urgency" sort={sort} setSort={setSort} />
          <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Demandeur</Table.ColumnHeaderCell>
          <SortableHeader label="Créée le" sortKey="age" sort={sort} setSort={setSort} />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => (
          <PurchaseRequestTableRow
            key={item.id}
            item={item}
            isSelected={item.id === selectedId}
            isChecked={checkedIds.has(item.id)}
            onClick={onSelect}
            onToggleCheck={onToggleCheck}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
PurchaseRequestsTable.propTypes = {
  items: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  checkedIds: PropTypes.instanceOf(Set).isRequired,
  onToggleCheck: PropTypes.func.isRequired,
  onToggleCheckAll: PropTypes.func.isRequired,
  sort: PropTypes.string.isRequired,
  setSort: PropTypes.func.isRequired,
};

