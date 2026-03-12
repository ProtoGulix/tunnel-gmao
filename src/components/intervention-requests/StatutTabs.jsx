/**
 * @fileoverview Barre d'onglets Radix UI filtrée par statut de demande d'intervention
 * @module components/intervention-requests/StatutTabs
 */

import PropTypes from 'prop-types';
import { Badge, Flex, Tabs, Text } from '@radix-ui/themes';

const ALL = '__all__';

/**
 * @param {Object} props
 * @param {Array}  props.facets - Tableau {code, label, color, count} depuis l'API
 * @param {string} props.activeStatut - Code du statut actif ('' = tous)
 * @param {Function} props.onStatutChange - (code: string) => void
 */
export default function StatutTabs({ facets, activeStatut, onStatutChange }) {
  const total = facets.reduce((acc, f) => acc + (f.count || 0), 0);
  const value = activeStatut || ALL;

  const handleChange = (v) => onStatutChange(v === ALL ? '' : v);

  return (
    <Tabs.Root value={value} onValueChange={handleChange}>
      <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
        <Tabs.Trigger value={ALL}>
          <Flex align="center" gap="1">
            <Text size="2">Toutes</Text>
            <Badge color="gray" variant="soft" size="1">{total}</Badge>
          </Flex>
        </Tabs.Trigger>
        {facets.map((f) => (
          <Tabs.Trigger key={f.code} value={f.code}>
            <Flex align="center" gap="1">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block', flexShrink: 0 }} />
              <Text size="2">{f.label}</Text>
              <Badge variant="soft" size="1" style={{ backgroundColor: f.color + '22', color: f.color }}>{f.count}</Badge>
            </Flex>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

StatutTabs.propTypes = {
  facets: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ).isRequired,
  activeStatut: PropTypes.string.isRequired,
  onStatutChange: PropTypes.func.isRequired,
};
