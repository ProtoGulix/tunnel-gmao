/**
 * Champ de recherche asynchrone pour les équipements.
 * Wrapper autour d'AsyncSearchSelect + badge de sélection.
 * @module components/planning/EquipementSearch
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Flex, Text, IconButton } from '@radix-ui/themes';
import { X, CheckCircle, AlertTriangle, AlertOctagon, Wrench, ClipboardList } from 'lucide-react';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import { fetchEquipements } from '@/api/equipements';

const HEALTH_CONFIG = {
  ok:       { color: 'green',  Icon: CheckCircle,   label: 'OK' },
  warning:  { color: 'amber',  Icon: AlertTriangle, label: 'Alerte' },
  critical: { color: 'red',    Icon: AlertOctagon,  label: 'Critique' },
};

function HealthBadge({ level }) {
  const cfg = HEALTH_CONFIG[level];
  if (!cfg) return null;
  const { color, Icon, label } = cfg;
  return (
    <Badge color={color} variant="soft" size="1">
      <Icon size={10} style={{ marginRight: 2 }} />
      {label}
    </Badge>
  );
}

HealthBadge.propTypes = { level: PropTypes.string };

function InterventionCount({ health }) {
  const count = health?.open_interventions_count;
  const urgent = health?.urgent_count;
  if (!count) return null;
  const color = urgent > 0 ? 'red' : 'amber';
  return (
    <Badge color={color} variant="soft" size="1">
      <Wrench size={10} style={{ marginRight: 2 }} />
      {count} inter. ouverte{count > 1 ? 's' : ''}{urgent > 0 ? ` · ${urgent} urgente${urgent > 1 ? 's' : ''}` : ''}
    </Badge>
  );
}

InterventionCount.propTypes = { health: PropTypes.object };

function NewRequestsCount({ health }) {
  const count = health?.new_requests_count;
  if (!count) return null;
  return (
    <Badge color="orange" variant="soft" size="1">
      <ClipboardList size={10} style={{ marginRight: 2 }} />
      {count} DI en attente
    </Badge>
  );
}

NewRequestsCount.propTypes = { health: PropTypes.object };

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
        <NewRequestsCount health={selected.health} />
        <InterventionCount health={selected.health} />
        <HealthBadge level={selected.health?.level} />
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
          <Text size="2" style={{ flex: 1 }}>{item.name}</Text>
          <NewRequestsCount health={item.health} />
          <InterventionCount health={item.health} />
          <HealthBadge level={item.health?.level} />
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
