/**
 * Champ de recherche asynchrone pour les équipements.
 * Wrapper autour d'AsyncSearchSelect + badge de sélection.
 * @module components/planning/EquipementSearch
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Flex, Text, IconButton } from '@radix-ui/themes';
import { X } from 'lucide-react';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import { fetchEquipements } from '@/api/equipements';

async function searchEquipements(query) {
  const res = await fetchEquipements({ search: query, limit: 20 });
  return Array.isArray(res) ? res : (res.items ?? []);
}

export default function EquipementSearch({ value, onChange, disabled, placeholder = 'Rechercher un équipement…' }) {
  const [selected, setSelected] = useState(value ?? null);

  const handleSelect = (item) => {
    setSelected(item);
    onChange(item);
  };

  const handleClear = () => {
    setSelected(null);
    onChange(null);
  };

  if (selected) {
    return (
      <Flex align="center" gap="2" style={{ padding: '6px 10px', background: 'var(--blue-3)', borderRadius: 'var(--radius-2)', border: '1px solid var(--blue-6)' }}>
        <Badge color="blue" variant="soft" size="1">{selected.code}</Badge>
        <Text size="2" weight="medium" style={{ flex: 1 }}>{selected.name}</Text>
        {!disabled && (
          <IconButton size="1" variant="ghost" color="gray" type="button" onClick={handleClear}>
            <X size={12} />
          </IconButton>
        )}
      </Flex>
    );
  }

  return (
    <AsyncSearchSelect
      fetchFn={searchEquipements}
      onSelect={handleSelect}
      placeholder={placeholder}
      renderItem={(item) => (
        <Flex align="center" gap="2">
          <Badge color="gray" variant="soft" size="1">{item.code}</Badge>
          <Text size="2">{item.name}</Text>
        </Flex>
      )}
    />
  );
}

EquipementSearch.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};
