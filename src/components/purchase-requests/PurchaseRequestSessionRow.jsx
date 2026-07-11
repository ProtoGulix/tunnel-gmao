import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Flex, IconButton, Spinner, Text } from '@radix-ui/themes';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { deletePurchaseRequest } from '@/api/purchaseRequests';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const URGENCY_BADGE = {
  normal: { label: 'Normal', color: 'gray' },
  high: { label: 'Élevée', color: 'orange' },
  critical: { label: 'Critique', color: 'red' },
};

export default function PurchaseRequestSessionRow({ item, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const urgencyCfg = URGENCY_BADGE[item.urgency] ?? URGENCY_BADGE.normal;

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deletePurchaseRequest(item.id);
      onDeleted(item.id);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Suppression impossible'));
      setDeleting(false);
    }
  };

  return (
    <Flex
      gap="2" px="3" py="2" align="center"
      style={{ borderTop: '1px solid var(--gray-3)', animation: 'fadeIn 0.25s ease-out' }}
    >
      <ShoppingCart size={13} color="var(--blue-9)" style={{ flexShrink: 0 }} />
      <Text size="1" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.item_label}
      </Text>
      <Badge size="1" variant="soft" color="blue" style={{ flexShrink: 0 }}>
        {item.quantity} {item.unit}
      </Badge>
      <Badge size="1" variant="soft" color={urgencyCfg.color} style={{ flexShrink: 0 }}>
        {urgencyCfg.label}
      </Badge>
      <IconButton
        size="1" variant="ghost" color="red" type="button"
        disabled={deleting}
        onClick={handleDelete}
        style={{ flexShrink: 0 }}
      >
        {deleting ? <Spinner size="1" /> : <Trash2 size={11} />}
      </IconButton>
      {error && (
        <Text size="1" color="red" style={{ flexShrink: 0 }}>{error}</Text>
      )}
    </Flex>
  );
}

PurchaseRequestSessionRow.propTypes = {
  item: PropTypes.object.isRequired,
  onDeleted: PropTypes.func.isRequired,
};
