import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { ShoppingCart, X } from 'lucide-react';
import PurchaseRequestForm from '@/components/purchase-requests/PurchaseRequestForm';

function ActionFormPurchaseRequest({ purchaseRequest, onChange }) {
  const [open, setOpen] = useState(!!purchaseRequest);

  const handleCancel = () => {
    setOpen(false);
    onChange(null);
  };

  const handlePrepare = (data) => {
    onChange(data);
    setOpen(false);
  };

  if (!open && !purchaseRequest) {
    return (
      <Button type="button" variant="soft" color="orange" size="2" onClick={() => setOpen(true)}>
        <ShoppingCart size={14} /> Lier une demande d&apos;achat
      </Button>
    );
  }

  if (!open && purchaseRequest) {
    return (
      <Flex
        align="center" gap="2"
        style={{ padding: '6px 10px', background: 'var(--orange-3)', borderRadius: 'var(--radius-2)', border: '1px solid var(--orange-6)' }}
      >
        <ShoppingCart size={14} color="var(--orange-9)" />
        <Text size="2" color="orange" weight="medium" style={{ flex: 1 }}>
          {purchaseRequest.item_label}
        </Text>
        <Badge color="orange" variant="soft" size="1">{purchaseRequest.quantity} {purchaseRequest.unit}</Badge>
        <Button type="button" variant="ghost" color="gray" size="1" onClick={() => setOpen(true)}>
          Modifier
        </Button>
        <Button type="button" variant="ghost" color="red" size="1" onClick={handleCancel}>
          <X size={12} />
        </Button>
      </Flex>
    );
  }

  return (
    <Box style={{ border: '1px solid var(--orange-6)', borderRadius: 'var(--radius-2)', padding: 'var(--space-3)', background: 'var(--orange-1)' }}>
      <Flex align="center" gap="2" mb="2">
        <ShoppingCart size={14} color="var(--orange-9)" />
        <Text size="2" weight="bold" color="orange">Demande d&apos;achat liée</Text>
      </Flex>
      <PurchaseRequestForm
        bare
        initialData={purchaseRequest ?? undefined}
        onSubmit={handlePrepare}
        onCancel={handleCancel}
        submitLabel="Préparer la demande"
        loading={false}
      />
    </Box>
  );
}

ActionFormPurchaseRequest.propTypes = {
  purchaseRequest: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

export default ActionFormPurchaseRequest;
