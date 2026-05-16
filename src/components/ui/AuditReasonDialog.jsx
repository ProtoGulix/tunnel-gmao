import { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Flex, Button, Text, Box } from '@radix-ui/themes';
import AuditReasonPicker from './AuditReasonPicker';

export default function AuditReasonDialog({ open, entityType, title, description, onConfirm, onCancel, saving = false }) {
  const [reason, setReason] = useState({ reason_code: '', reason_text: null });
  const [requiresText, setRequiresText] = useState(false);

  const isValid = !!reason.reason_code && (!requiresText || !!reason.reason_text?.trim());

  const handleChange = (v) => {
    setReason((prev) => ({ ...prev, ...v }));
    if ('requires_text' in v) setRequiresText(!!v.requires_text);
  };

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(reason);
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setReason({ reason_code: '', reason_text: null });
      setRequiresText(false);
      onCancel();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="420px" style={{ padding: '20px 24px' }}>
        <Dialog.Title size="3" mb="1">{title}</Dialog.Title>

        {description && (
          <Text as="p" size="2" color="gray" mb="3" style={{ marginTop: 2, marginBottom: 12 }}>
            {description}
          </Text>
        )}

        <Box mb="4">
          <AuditReasonPicker
            entityType={entityType}
            value={reason}
            onChange={handleChange}
          />
        </Box>

        <Flex gap="2" justify="end">
          <Button variant="soft" color="gray" onClick={onCancel} disabled={saving}>
            Annuler
          </Button>
          <Button
            color="blue"
            onClick={handleConfirm}
            disabled={!isValid || saving}
            loading={saving}
          >
            Confirmer
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

AuditReasonDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  entityType: PropTypes.oneOf(['intervention', 'request', 'purchase_request', 'task', 'action']).isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
