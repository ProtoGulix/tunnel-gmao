/**
 * État vide du panneau de détail de l'onglet demandes d'achat.
 * @module components/purchase/tabs/PurchaseRequestsDetailEmptyState
 */
import { Flex, Text } from '@radix-ui/themes';
import { MousePointerClick, ShoppingCart } from 'lucide-react';
import PropTypes from 'prop-types';

export function DetailEmptyState({ label }) {
  return (
    <Flex direction="column" align="center" justify="center" gap="3" style={{ height: '100%', padding: 32, opacity: 0.6 }}>
      <ShoppingCart size={36} color="var(--gray-7)" />
      <Flex direction="column" align="center" gap="1">
        <Text size="2" weight="medium" color="gray">{label}</Text>
        <Flex align="center" gap="1">
          <MousePointerClick size={12} color="var(--gray-8)" />
          <Text size="1" color="gray">Cliquez sur une demande pour voir son détail</Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
DetailEmptyState.propTypes = { label: PropTypes.string };
