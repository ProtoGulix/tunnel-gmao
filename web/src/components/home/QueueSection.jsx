/**
 * @fileoverview Section de la file « à traiter » : titre, nombre, lignes en enfants.
 * @module components/home/QueueSection
 */
import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';

export default function QueueSection({ title, count, children }) {
  return (
    <Flex direction="column">
      <Flex align="center" gap="2" px="3" py="1"
        style={{ background: 'var(--gray-3)', borderBottom: '1px solid var(--gray-4)' }}>
        <Text size="1" weight="bold" color="gray">{title}</Text>
        <Text size="1" color="gray">({count})</Text>
      </Flex>
      {children}
    </Flex>
  );
}

QueueSection.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
};
