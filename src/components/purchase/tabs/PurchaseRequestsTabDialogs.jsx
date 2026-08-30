/**
 * Boîtes de dialogue de confirmation de l'onglet demandes d'achat
 * (abandon d'édition non enregistrée, suppression par lot).
 * @module components/purchase/tabs/PurchaseRequestsTabDialogs
 */
import { AlertDialog, Button, Flex, Text } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
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

export function BulkDeleteDialog({ open, onOpenChange, labels, onConfirm, deleting }) {
  const count = labels.length;
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content maxWidth="480px">
        <AlertDialog.Title>Supprimer {count} demande{count > 1 ? 's' : ''} d&apos;achat</AlertDialog.Title>
        <AlertDialog.Description size="2">
          <Text weight="bold">{labels.join(', ')}</Text>
          {' '}seront supprimées définitivement. Cette action est irréversible.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">Annuler</Button>
          </AlertDialog.Cancel>
          <Button variant="solid" color="red" onClick={onConfirm} loading={deleting}>
            <Trash2 size={14} /> Supprimer définitivement
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
BulkDeleteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  onConfirm: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
};
