/**
 * @fileoverview Champ équipement de InterventionRequestForm : verrouillé si
 * imposé par le contexte (fiche équipement), sélectionné, ou à rechercher.
 * @module components/intervention-requests/EquipmentPickerField
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { MapPin } from 'lucide-react';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import LockedBadge from '@/components/ui/LockedBadge';
import { fetchEquipements } from '@/api/equipements';

function renderEquipementItem(eq) {
  return (
    <Flex align="center" gap="2">
      {eq.code && <Badge color="blue" variant="soft" size="1">{eq.code}</Badge>}
      <Text size="2" weight="bold">{eq.name}</Text>
    </Flex>
  );
}

export default function EquipmentPickerField({ machineId, machineName, locked, onSelect, onClear }) {
  return (
    <Box>
      <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
        Équipement <Text color="red">*</Text>
      </Text>
      {!machineId && (
        <AsyncSearchSelect
          fetchFn={(q) => fetchEquipements({ search: q }).then((r) => r.items ?? [])}
          onSelect={onSelect}
          renderItem={renderEquipementItem}
          placeholder="Rechercher par code ou nom…"
          minChars={1}
        />
      )}
      {machineId && locked && (
        <LockedBadge icon={MapPin} label={machineName} color="blue" />
      )}
      {machineId && !locked && (
        <Flex align="center" gap="2" style={{ padding: '6px 10px', background: 'var(--green-3)', borderRadius: 'var(--radius-2)', border: '1px solid var(--green-6)' }}>
          <MapPin size={14} color="var(--green-9)" />
          <Text size="2" weight="medium" style={{ flex: 1 }}>{machineName}</Text>
          <Button size="1" variant="ghost" color="gray" type="button" onClick={onClear}>×</Button>
        </Flex>
      )}
    </Box>
  );
}

EquipmentPickerField.propTypes = {
  machineId: PropTypes.string,
  machineName: PropTypes.string,
  locked: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};
