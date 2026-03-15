/**
 * Sélecteur d'intervention déclenché par la sélection d'un équipement.
 * Charge les interventions ouvertes via GET /interventions/open-by-equipement/{id}.
 * @module components/planning/InterventionSelector
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Flex, Link, Select, Text } from '@radix-ui/themes';
import { Loader2 } from 'lucide-react';
import { fetchOpenInterventionsByEquipement } from '@/api/planning';

const STATUS_LABELS = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
};

export default function InterventionSelector({ equipementId, value, onChange, disabled }) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!equipementId) {
      setInterventions([]);
      onChange(null);
      return;
    }
    setLoading(true);
    fetchOpenInterventionsByEquipement(equipementId)
      .then((data) => {
        setInterventions(data);
        if (data.length === 1) {
          onChange(data[0]);
        } else {
          onChange(null);
        }
      })
      .catch(() => setInterventions([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipementId]);

  if (!equipementId) {
    return (
      <Text size="2" color="gray" style={{ padding: '6px 0', display: 'block' }}>
        Sélectionnez d&apos;abord un équipement
      </Text>
    );
  }

  if (loading) {
    return (
      <Flex align="center" gap="2">
        <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
        <Text size="2" color="gray">Chargement…</Text>
      </Flex>
    );
  }

  if (interventions.length === 0) {
    return (
      <Flex direction="column" gap="1">
        <Text size="2" color="amber">Aucune intervention ouverte sur cet équipement.</Text>
        <Link href="/intervention/new" size="2">Créer une intervention</Link>
      </Flex>
    );
  }

  if (interventions.length === 1) {
    const i = interventions[0];
    return (
      <Flex align="center" gap="2" style={{ padding: '6px 10px', background: 'var(--green-3)', borderRadius: 'var(--radius-2)', border: '1px solid var(--green-6)' }}>
        <Badge color="green" variant="soft" size="1">{i.code}</Badge>
        <Text size="2" weight="medium">{i.title}</Text>
        <Badge color="gray" variant="soft" size="1">{STATUS_LABELS[i.status_actual] ?? i.status_actual}</Badge>
      </Flex>
    );
  }

  return (
    <Select.Root
      value={value?.id ?? ''}
      onValueChange={(id) => onChange(interventions.find((i) => i.id === id) ?? null)}
      disabled={disabled}
    >
      <Select.Trigger placeholder="Sélectionner une intervention…" style={{ width: '100%' }} />
      <Select.Content>
        {interventions.map((i) => (
          <Select.Item key={i.id} value={i.id}>
            <Flex align="center" gap="2">
              <Text size="2" weight="medium">{i.code}</Text>
              <Text size="2" color="gray">— {i.title}</Text>
              <Badge color="gray" variant="soft" size="1">{STATUS_LABELS[i.status_actual] ?? i.status_actual}</Badge>
            </Flex>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

InterventionSelector.propTypes = {
  equipementId: PropTypes.string,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
