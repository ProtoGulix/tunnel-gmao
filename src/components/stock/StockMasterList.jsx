/**
 * @fileoverview Panneau master — liste des pièces référencées avec recherche et filtres
 * @module components/stock/StockMasterList
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight, Package, Search, X } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';

const ALL = '__all__';

function FamilyFilters({ facets, familyCode, onFamilyChange, subFamilyCode, onSubFamilyChange }) {
  const selectedFamily = useMemo(
    () => facets.families.find((f) => f.code === familyCode),
    [facets, familyCode]
  );
  const subFamilies = selectedFamily?.sub_families ?? [];

  return (
    <Flex gap="2" wrap="wrap">
      <Select.Root
        value={familyCode || ALL}
        onValueChange={(v) => onFamilyChange(v === ALL ? '' : v)}
        size="1"
      >
        <Select.Trigger
          placeholder="Toutes les familles"
          variant={familyCode ? 'soft' : 'surface'}
          color={familyCode ? 'blue' : undefined}
          style={{ flexShrink: 0 }}
        />
        <Select.Content>
          <Select.Item value={ALL}>Toutes les familles</Select.Item>
          {facets.families.map((f) => (
            <Select.Item key={f.code} value={f.code}>
              {f.code}{f.label ? ` — ${f.label}` : ''}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root
        value={subFamilyCode || ALL}
        onValueChange={(v) => onSubFamilyChange(v === ALL ? '' : v)}
        disabled={subFamilies.length === 0}
        size="1"
      >
        <Select.Trigger
          placeholder="Sous-famille"
          variant={subFamilyCode ? 'soft' : 'surface'}
          color={subFamilyCode ? 'indigo' : undefined}
          style={{ flexShrink: 0 }}
        />
        <Select.Content>
          <Select.Item value={ALL}>Toutes</Select.Item>
          {subFamilies.map((s) => (
            <Select.Item key={s.code} value={s.code}>
              {s.code}{s.label ? ` — ${s.label}` : ''}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

FamilyFilters.propTypes = {
  facets: PropTypes.shape({ families: PropTypes.array.isRequired }).isRequired,
  familyCode: PropTypes.string,
  onFamilyChange: PropTypes.func.isRequired,
  subFamilyCode: PropTypes.string,
  onSubFamilyChange: PropTypes.func.isRequired,
};

function StockBadge({ quantity, unit }) {
  if (quantity == null) return <Badge color="gray" variant="soft" size="1">Non renseigné</Badge>;
  if (quantity === 0) return <Badge color="red" variant="soft" size="1">Rupture</Badge>;
  if (quantity <= 3) return <Badge color="orange" variant="soft" size="1">Stock bas · {quantity}{unit ? ` ${unit}` : ''}</Badge>;
  return <Badge color="green" variant="soft" size="1">{quantity}{unit ? ` ${unit}` : ''}</Badge>;
}

StockBadge.propTypes = {
  quantity: PropTypes.number,
  unit: PropTypes.string,
};

function RefItem({ item, isSelected, onClick }) {
  return (
    <Box
      onClick={() => onClick(item)}
      style={{
        padding: '10px 14px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--gray-4)',
        background: isSelected ? 'var(--accent-3)' : 'var(--gray-1)',
        boxShadow: isSelected ? 'inset 3px 0 0 var(--accent-9)' : undefined,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--gray-3)'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--gray-1)'; }}
    >
      <Flex direction="column" gap="1">
        <Text size="2" weight="medium" style={{ lineHeight: 1.3 }}>{item.name}</Text>
        <Flex gap="2" align="center" wrap="wrap">
          <Badge variant="outline" color="gray" size="1" style={{ fontFamily: 'monospace', fontSize: 10 }}>
            {item.ref}
          </Badge>
          {item.family_code && (
            <Badge variant="soft" color="gray" size="1">{item.family_code}{item.sub_family_code ? `/${item.sub_family_code}` : ''}</Badge>
          )}
        </Flex>
        <Flex gap="2" align="center" mt="1" wrap="wrap">
          <StockBadge quantity={item.quantity} unit={item.unit} />
          {item.supplier_refs_count > 0
            ? <Badge color="blue" variant="soft" size="1">{item.supplier_refs_count} fourn.</Badge>
            : <Badge color="gray" variant="outline" size="1">À qualifier</Badge>
          }
          {item.location && (
            <Text size="1" color="gray">📍 {item.location}</Text>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

RefItem.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

export default function StockMasterList({
  items, loading, search, onSearchChange,
  facets, familyCode, onFamilyChange, subFamilyCode, onSubFamilyChange,
  selectedId, onSelect, count, pagination,
}) {
  const hasPagination = pagination && pagination.totalPages > 1;

  return (
    <Box style={{ border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-5)', background: 'var(--gray-2)', flexShrink: 0 }}>
        <Flex align="center" gap="2" mb="2">
          <Package size={14} color="var(--gray-11)" />
          <Text size="2" weight="bold" color="gray">Pièces référencées</Text>
          {count > 0 && <Badge color="gray" variant="soft" size="1">{count}</Badge>}
        </Flex>

        <TextField.Root
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par nom, fabricant, ref…"
          size="2"
          mb="2"
        >
          <TextField.Slot>
            <Search size={13} color="var(--gray-9)" />
          </TextField.Slot>
          {search && (
            <TextField.Slot side="right" style={{ cursor: 'pointer' }} onClick={() => onSearchChange('')}>
              <X size={13} color="var(--gray-9)" />
            </TextField.Slot>
          )}
        </TextField.Root>

        <FamilyFilters
          facets={facets}
          familyCode={familyCode}
          onFamilyChange={onFamilyChange}
          subFamilyCode={subFamilyCode}
          onSubFamilyChange={onSubFamilyChange}
        />
      </Box>

      {/* Liste */}
      <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: 620 }}>
        {loading ? (
          <LoadingState fullscreen={false} message="Chargement…" />
        ) : items.length === 0 ? (
          <Flex direction="column" align="center" justify="center" style={{ height: 200, padding: 24 }} gap="2">
            <Package size={28} color="var(--gray-7)" />
            <Text size="2" color="gray">Aucune pièce trouvée</Text>
          </Flex>
        ) : (
          items.map((item) => (
            <RefItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
              onClick={onSelect}
            />
          ))
        )}
      </Box>

      {/* Footer pagination */}
      {hasPagination && (
        <Box style={{ padding: '8px 12px', borderTop: '1px solid var(--gray-5)', background: 'var(--gray-2)', flexShrink: 0 }}>
          <Flex align="center" justify="between">
            <Text size="1" color="gray">
              Page {pagination.currentPage} / {pagination.totalPages}
              {count > 0 && <> · {count} pièces</>}
            </Text>
            <Flex gap="1">
              <Button
                size="1" variant="soft" color="gray"
                disabled={pagination.currentPage <= 1}
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              >
                <ChevronLeft size={12} />
              </Button>
              <Button
                size="1" variant="soft" color="gray"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              >
                <ChevronRight size={12} />
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}
    </Box>
  );
}

StockMasterList.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  facets: PropTypes.shape({ families: PropTypes.array.isRequired }).isRequired,
  familyCode: PropTypes.string,
  onFamilyChange: PropTypes.func.isRequired,
  subFamilyCode: PropTypes.string,
  onSubFamilyChange: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  count: PropTypes.number,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    onPageChange: PropTypes.func,
  }),
};
