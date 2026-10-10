/**
 * @fileoverview Contrôles du panneau gauche : affichage Arbre/À plat, tri, filtre de classe
 * @module components/equipements/EquipementListFilters
 */

import PropTypes from 'prop-types';
import { Flex, Select, SegmentedControl } from '@radix-ui/themes';
import { Layers } from 'lucide-react';

const ALL_CLASSES = '__all__';

export default function EquipementListFilters({
  mode, onModeChange, treeDisabled,
  sort, onSortChange,
  classFilter, onClassChange, classOptions,
}) {
  return (
    <Flex align="center" gap="2" wrap="wrap" style={{ flex: 1 }}>
      <SegmentedControl.Root size="1" value={mode} onValueChange={onModeChange} aria-label="Affichage">
        <SegmentedControl.Item value="tree" disabled={treeDisabled}>Arbre</SegmentedControl.Item>
        <SegmentedControl.Item value="flat">À plat</SegmentedControl.Item>
      </SegmentedControl.Root>
      <Select.Root value={sort} onValueChange={onSortChange} size="1">
        <Select.Trigger variant="soft" aria-label="Tri" />
        <Select.Content>
          <Select.Item value="health">Tri : Santé</Select.Item>
          <Select.Item value="code">Tri : Code</Select.Item>
        </Select.Content>
      </Select.Root>
      {classOptions.length > 0 && (
        <Select.Root
          value={classFilter || ALL_CLASSES}
          onValueChange={(v) => onClassChange(v === ALL_CLASSES ? '' : v)}
          size="1"
        >
          <Select.Trigger variant="soft" aria-label="Classe">
            <Layers size={12} style={{ marginRight: 4 }} />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL_CLASSES}>Toutes les classes</Select.Item>
            {classOptions.map((f) => (
              <Select.Item key={f.code} value={f.code}>{f.label ?? f.code} ({f.count})</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      )}
    </Flex>
  );
}

EquipementListFilters.propTypes = {
  mode: PropTypes.oneOf(['tree', 'flat']).isRequired,
  onModeChange: PropTypes.func.isRequired,
  treeDisabled: PropTypes.bool,
  sort: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  classFilter: PropTypes.string,
  onClassChange: PropTypes.func.isRequired,
  classOptions: PropTypes.array.isRequired,
};
