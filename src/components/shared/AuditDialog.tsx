import { useState } from 'react';
import { Flex, Text, Button, Dialog, Spinner } from '@radix-ui/themes';
import { useAuditReasons } from '@/hooks/useAuditReasons';

interface AuditDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  saving?: boolean;
  onClose: () => void;
  onConfirm: (reasonCode: string, reasonText: string) => void;
}

export function AuditDialog({ open, title, description, saving, onClose, onConfirm }: AuditDialogProps) {
  const reasons = useAuditReasons();
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');

  const selected    = reasons.find((r) => r.code === reasonCode);
  const needsText   = selected?.requires_text ?? reasonCode === 'OTHER';
  const canConfirm  = !!reasonCode && (!needsText || reasonText.trim().length > 0);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        <Dialog.Title>{title ?? 'Confirmer la modification'}</Dialog.Title>
        {description && (
          <Dialog.Description size="2" color="gray" mb="3">
            {description}
          </Dialog.Description>
        )}
        <Flex direction="column" gap="3" mt="3">
          {reasons.length === 0 ? (
            <Flex justify="center"><Spinner size="2" /></Flex>
          ) : (
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--gray-6)', fontSize: 13, background: 'var(--color-background)', color: 'var(--gray-12)' }}
            >
              <option value="">— Choisir une raison —</option>
              {reasons.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          )}
          {needsText && (
            <textarea
              placeholder="Précisez la raison…"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={2}
              style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--gray-6)', fontSize: 13, resize: 'vertical', background: 'var(--color-background)', color: 'var(--gray-12)' }}
            />
          )}
          {selected && (
            <Text size="1" style={{ color: selected.color, fontStyle: 'italic' }}>
              {selected.label}
            </Text>
          )}
        </Flex>
        <Flex gap="2" justify="end" mt="4">
          <Dialog.Close><Button variant="soft" color="gray" onClick={onClose}>Annuler</Button></Dialog.Close>
          <Button
            variant="solid" color="blue"
            disabled={saving || !canConfirm}
            onClick={() => onConfirm(reasonCode, reasonText)}
          >
            {saving ? <Spinner size="1" /> : 'Confirmer'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
