/**
 * @fileoverview Tuiles chiffrées de la file : urgentes, en attente, sans action, préventif.
 * @module components/home/QueueTiles
 */
import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';
import { TILE_IDS } from '@/hooks/home/bilanFilter';

export default function QueueTiles({ titles, counts, activeId, onSelect }) {
  return (
    <Flex gap="2" wrap="wrap" px="4" pt="2">
      {TILE_IDS.map((id) => (
        <button
          key={id} type="button" aria-pressed={id === activeId} onClick={() => onSelect({ kind: 'tile', value: id })}
          style={{
            all: 'unset', cursor: 'pointer', flex: '1 1 140px', boxSizing: 'border-box', padding: '4px 10px',
            border: '1px solid var(--gray-a5)', borderRadius: 'var(--radius-3)',
            outline: id === activeId ? '2px solid var(--accent-8)' : undefined,
          }}
        >
          <Flex justify="between" align="baseline" gap="2">
            <Text size="2" color="gray">{titles[id]}</Text>
            <Text size="3" weight="bold">{counts[id]}</Text>
          </Flex>
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
