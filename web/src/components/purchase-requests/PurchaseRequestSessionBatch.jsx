import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import { ShoppingCart } from 'lucide-react';
import PurchaseRequestSessionRow from './PurchaseRequestSessionRow';

export default function PurchaseRequestSessionBatch({ batch, onRowDeleted }) {
  return (
    <Flex align="stretch" gap="4">
      {/* Continuité du trait pointillé de la timeline (pas une étape à part entière) */}
      <Flex direction="column" align="center" style={{ flexShrink: 0, width: 18 }}>
        <div style={{ flex: 1, borderLeft: '2.5px dashed var(--gray-6)' }} />
      </Flex>

      <Box mb="1" style={{ flex: 1, minWidth: 0, margin: '8px 0', border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-2)', overflow: 'hidden' }}>
        <Box px="3" py="2" style={{ background: 'var(--gray-2)' }}>
          <Text size="1" weight="bold" color="gray">
            {batch.length > 0
              ? `${batch.length} demande${batch.length > 1 ? 's' : ''} créée${batch.length > 1 ? 's' : ''} cette session`
              : 'Aucune demande créée pour cette session'}
          </Text>
        </Box>
        {batch.length === 0 ? (
          <Box px="3" py="3" style={{ textAlign: 'center' }}>
            <ShoppingCart size={16} color="var(--gray-7)" style={{ marginBottom: 4 }} />
            <Text size="1" color="gray" style={{ display: 'block', fontStyle: 'italic' }}>
              Les demandes créées ci-dessous apparaîtront ici
            </Text>
          </Box>
        ) : (
          <Box style={{ maxHeight: 180, overflowY: 'auto' }}>
            {batch.map((item) => (
              <PurchaseRequestSessionRow key={item.id} item={item} onDeleted={onRowDeleted} />
            ))}
          </Box>
        )}
      </Box>
    </Flex>
  );
}

PurchaseRequestSessionBatch.propTypes = {
  batch: PropTypes.array.isRequired,
  onRowDeleted: PropTypes.func.isRequired,
};

