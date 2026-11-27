/**
 * @fileoverview Coque d'une ligne compacte de la file : sélection, deux lignes de texte.
 * @module components/home/QueueRow
 */
import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';

export default function QueueRow({ isSelected, onSelect, title, subtitle, children }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected ? 'true' : undefined}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        border: 'none',
        borderBottom: '1px solid var(--gray-4)',
        padding: '8px 12px',
        font: 'inherit',
        color: 'inherit',
        background: isSelected ? 'var(--accent-3)' : 'transparent',
        boxShadow: isSelected ? 'inset 3px 0 0 var(--accent-9)' : undefined,
      }}
    >
      <Flex align="center" gap="2" wrap="wrap">
        <Text size="2" weight="medium">{title}</Text>
        {children}
      </Flex>
      {subtitle && <Text as="div" size="1" color="gray" truncate>{subtitle}</Text>}
    </button>
  );
}

QueueRow.propTypes = {
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
};
