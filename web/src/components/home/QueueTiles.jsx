/**
 * @fileoverview Tuiles chiffrées de la file : urgentes, en attente, sans action, préventif.
 * @module components/home/QueueTiles
 */
import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';
import { TILE_IDS } from '@/hooks/home/bilanFilter';

export default function QueueTiles({ titles, counts, activeId, onSelect }) {
  return (
    <Flex gap="3" wrap="wrap" px="4" pt="4">
      {TILE_IDS.map((id) => (
        <button
          key={id} type="button" aria-pressed={id === activeId} onClick={() => onSelect({ kind: 'tile', value: id })}
          style={{
            all: 'unset', cursor: 'pointer', flex: '1 1 140px', boxSizing: 'border-box', padding: '10px 12px',
            border: '1px solid var(--gray-a5)', borderRadius: 'var(--radius-3)',
            outline: id === activeId ? '2px solid var(--accent-8)' : undefined,
          }}
        >
          <Text as="div" size="1" color="gray">{titles[id]}</Text>
          <Text as="div" size="6" weight="bold">{counts[id]}</Text>
        </button>
      ))}
    </Flex>
  );
}

QueueTiles.propTypes = {
  titles: PropTypes.objectOf(PropTypes.string).isRequired,
  counts: PropTypes.objectOf(PropTypes.number).isRequired,
  activeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};
