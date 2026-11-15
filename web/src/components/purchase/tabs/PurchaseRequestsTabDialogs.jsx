/**
 * Boîtes de dialogue de confirmation de l'onglet demandes d'achat
 * (abandon d'édition non enregistrée, suppression par lot).
 * @module components/purchase/tabs/PurchaseRequestsTabDialogs
 */
import { AlertDialog, Button, Flex } from '@radix-ui/themes';
import AuditReasonDialog from '@/components/ui/AuditReasonDialog';
import { DECISION_DELETED } from '@/lib/api/auditReasonFilter';
import PropTypes from 'prop-types';

export function UnsavedChangesDialog({ open, onCancel, onConfirm }) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Modifications non enregistrées</AlertDialog.Title>
        <AlertDialog.Description size="2">
          Cette demande d&apos;achat a des modifications non enregistrées. Si vous continuez, elles seront perdues.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" onClick={onCancel}>Rester sur l&apos;édition</Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button variant="solid" color="red" onClick={onConfirm}>Abandonner les modifications</Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
UnsavedChangesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

/** Suppression par lot : un seul motif « deleted » (fenêtre commune), appliqué à chaque demande. */
export function BulkDeleteDialog({ open, labels, onConfirm, onCancel, deleting }) {
  const count = labels.length;
  return (
    <AuditReasonDialog
      open={open}
      entityType="purchase_request"
      decisionType={DECISION_DELETED}
      title={`Supprimer ${count} demande${count > 1 ? 's' : ''} d'achat`}
      description={`${labels.join(', ')} : suppression définitive, irréversible.`}
      saving={deleting}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
BulkDeleteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
};
