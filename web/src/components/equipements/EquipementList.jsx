/**
 * @fileoverview Liste maître des équipements (arbre replié ou liste à plat)
 * @module components/equipements/EquipementList
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Tooltip } from '@radix-ui/themes';
import { ChevronDown, ChevronRight } from 'lucide-react';
import EquipementHealthDot from '@/components/equipements/EquipementHealthDot';
import EquipementStatutBadge from '@/components/equipements/EquipementStatutBadge';
import { ROW_PADDING_X, ROW_PADDING_Y, ROW_MIN_HEIGHT } from '@/styles/tokens/density';

const INDENT_PX = 16;
const CHEVRON_SLOT_PX = 18;

function tooltipContent(eq) {
  const parts = [];
  if (eq.equipement_class) parts.push(`Classe : ${eq.equipement_class.label ?? eq.equipement_class.code}`);
  if (eq.health?.reason) parts.push(eq.health.reason);
  return parts.join(' — ');
}

function pathLabel(eq) {
  return (eq.ancestors ?? []).map((a) => a.code || a.name).join(' › ');
}

function ChevronSlot({ chevron }) {
  if (chevron === undefined) return null;
  return <span style={{ width: CHEVRON_SLOT_PX, flexShrink: 0, display: 'inline-flex' }}>{chevron}</span>;
}
ChevronSlot.propTypes = { chevron: PropTypes.node };

function EquipementRow({ eq, depth, selected, onSelect, chevron, showPath }) {
  const tip = tooltipContent(eq);
  const path = showPath ? pathLabel(eq) : '';

  const row = (
    <Box
      role="treeitem"
      aria-selected={selected}
      data-testid="equipement-row"
      onClick={() => onSelect(eq.id)}
      style={{
        cursor: 'pointer',
        padding: `${ROW_PADDING_Y} ${ROW_PADDING_X}`,
        paddingLeft: `calc(${ROW_PADDING_X} + ${depth * INDENT_PX}px)`,
        minHeight: ROW_MIN_HEIGHT,
        boxSizing: 'border-box',
        borderBottom: '1px solid var(--gray-4)',
        background: selected ? 'var(--blue-2)' : 'transparent',
        borderLeft: selected ? '3px solid var(--blue-9)' : '3px solid transparent',
      }}
    >
      <Flex align="center" gap="2">
        <ChevronSlot chevron={chevron} />
        <EquipementHealthDot level={eq.health?.level} />
        <Text size="2" weight="medium" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {eq.code || '—'} – {eq.name}
        </Text>
        <EquipementStatutBadge statut={eq.statut} />
      </Flex>
      {path && (
        <Text size="1" color="gray" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 18 }}>
          {path}
        </Text>
      )}
    </Box>
  );

  return tip ? <Tooltip content={tip}>{row}</Tooltip> : row;
}

EquipementRow.propTypes = {
  eq: PropTypes.object.isRequired,
  depth: PropTypes.number,
  selected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  chevron: PropTypes.node,
  showPath: PropTypes.bool,
};

function Placeholder({ depth, children, color }) {
  return (
    <Text
      size="1"
      color={color ?? 'gray'}
      style={{ display: 'block', padding: `4px ${ROW_PADDING_X}`, paddingLeft: `calc(${ROW_PADDING_X} + ${(depth + 1) * INDENT_PX + CHEVRON_SLOT_PX}px)` }}
    >
      {children}
    </Text>
  );
}
Placeholder.propTypes = { depth: PropTypes.number, children: PropTypes.node, color: PropTypes.string };

function TreeNodes({ items, depth, tree, selectedId, onSelect }) {
  return items.map((eq) => {
    const hasChildren = (eq.children_count ?? 0) > 0;
    const open = tree.expanded.has(eq.id);
    const node = tree.childrenMap[eq.id];
    const chevron = hasChildren ? (
      <button
        type="button"
        aria-label={open ? 'Replier' : 'Déplier'}
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); tree.toggle(eq.id); }}
        style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', color: 'var(--gray-11)' }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
    ) : null;

    return (
      <Box key={eq.id} role="group">
        <EquipementRow
          eq={eq}
          depth={depth}
          selected={String(eq.id) === String(selectedId)}
          onSelect={onSelect}
          chevron={chevron}
        />
        {open && hasChildren && (
          !node || node.loading ? <Placeholder depth={depth}>Chargement…</Placeholder>
            : node.error ? <Placeholder depth={depth} color="red">{node.error}</Placeholder>
              : <TreeNodes items={node.items} depth={depth + 1} tree={tree} selectedId={selectedId} onSelect={onSelect} />
        )}
      </Box>
    );
  });
}
TreeNodes.propTypes = {
  items: PropTypes.array.isRequired,
  depth: PropTypes.number.isRequired,
  tree: PropTypes.object.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

/**
 * @param {'tree'|'flat'} mode
 * @param {Array} items - équipements du mode à plat
 * @param {Object} tree - { roots, childrenMap, expanded, toggle }
 */
export default function EquipementList({ mode, items, tree, selectedId, onSelect, emptyLabel, error }) {
  if (mode === 'flat') {
    if (error) return <Placeholder depth={-1} color="red">{error}</Placeholder>;
    if (items.length === 0) return <Placeholder depth={-1}>{emptyLabel}</Placeholder>;
    return (
      <Box role="tree">
        {items.map((eq) => (
          <EquipementRow
            key={eq.id}
            eq={eq}
            depth={0}
            selected={String(eq.id) === String(selectedId)}
            onSelect={onSelect}
            showPath
          />
        ))}
      </Box>
    );
  }

  if (tree.roots.error) return <Placeholder depth={-1} color="red">{tree.roots.error}</Placeholder>;
  if (tree.roots.items.length === 0) return <Placeholder depth={-1}>{emptyLabel}</Placeholder>;
  return (
    <Box role="tree">
      <TreeNodes items={tree.roots.items} depth={0} tree={tree} selectedId={selectedId} onSelect={onSelect} />
    </Box>
  );
}

EquipementList.propTypes = {
  mode: PropTypes.oneOf(['tree', 'flat']).isRequired,
  items: PropTypes.array,
  tree: PropTypes.object.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  emptyLabel: PropTypes.string,
  error: PropTypes.string,
};
