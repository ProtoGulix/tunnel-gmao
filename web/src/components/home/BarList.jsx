/**
 * @fileoverview Lignes à barre cliquables du bilan (tranches d'âge, sites, équipements) :
 * libellé, barre proportionnelle au plus grand compte, nombre.
 * @module components/home/BarList
 */
import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';

export default function BarList({ items, activeKey, onSelect }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Flex direction="column" gap="1">
      {items.map((item) => (
        <button
          key={item.key} type="button" onClick={() => onSelect(item.key)} aria-pressed={item.key === activeKey}
          style={{
            all: 'unset', cursor: 'pointer', display: 'block', borderRadius: 'var(--radius-2)', padding: '3px 6px',
            background: item.key === activeKey ? 'var(--accent-a4)' : undefined,
          }}
        >
          <Flex justify="between" gap="2">
            <Text size="1" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</Text>
            <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
              {item.note ? `${item.note} · ` : ''}<Text weight="bold" color="gray">{item.count}</Text>
            </Text>
          </Flex>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--gray-a4)', marginTop: 2 }}>
            <div style={{ height: '100%', width: `${(item.count / max) * 100}%`, borderRadius: 3, background: 'var(--accent-9)' }} />
          </div>
        </button>
      ))}
    </Flex>
  );
}

BarList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired, label: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired, note: PropTypes.string,
  })).isRequired,
  activeKey: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};
