/**
 * @fileoverview Lignes à barre du bilan (tranches d'âge, sites, équipements), cliquables si `onSelect` :
 * libellé, barre proportionnelle au plus grand compte, nombre. Une ligne peut être en alerte (`alertKey`).
 * @module components/home/BarList
 */
import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';

export default function BarList({ items, activeKey, alertKey, onSelect }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Flex direction="column" gap="1">
      {items.map((item) => {
        const alert = item.key === alertKey;
        const content = (
          <>
            <Flex justify="between" gap="2">
              <Text size="1" color={alert ? 'red' : undefined} weight={alert ? 'bold' : undefined} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</Text>
              <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
                <Text weight="bold" color={alert ? 'red' : undefined}>{item.count}</Text>{item.note ? ` · ${item.note}` : ''}
              </Text>
            </Flex>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--gray-a2)', marginTop: 2 }}>
              <div style={{ height: '100%', width: `${(item.count / max) * 100}%`, borderRadius: 3, background: alert ? 'var(--red-9)' : 'var(--accent-9)' }} />
            </div>
          </>
        );
        const style = { display: 'block', borderRadius: 'var(--radius-2)', padding: '3px 6px' };
        if (!onSelect) return <div key={item.key} title={item.title} style={style}>{content}</div>;
        return (
          <button
            key={item.key} type="button" title={item.title} onClick={() => onSelect(item.key)}
            style={{ all: 'unset', cursor: 'pointer', ...style, background: item.key === activeKey ? 'var(--accent-a4)' : undefined }}
          >
            {content}
          </button>
        );
      })}
    </Flex>
  );
}

BarList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired, label: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired, note: PropTypes.string, title: PropTypes.string,
  })).isRequired,
  activeKey: PropTypes.string,
  alertKey: PropTypes.string,
  onSelect: PropTypes.func,
};
