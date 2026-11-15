/**
 * @fileoverview Confirmation de désactivation d'un plan préventif
 * @module components/preventive/PlanDeactivateDialog
 */

import PropTypes from 'prop-types';
import { AlertDialog, Button, Flex } from '@radix-ui/themes';

export default function PlanDeactivateDialog({ plan, onConfirm, onClose }) {
  return (
    <AlertDialog.Root open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Désactiver le plan</AlertDialog.Title>
        <AlertDialog.Description>
          Désactiver <strong>{plan?.label}</strong> ? Les occurrences futures ne seront plus générées.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">Annuler</Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="red" onClick={onConfirm}>Désactiver</Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}

PlanDeactivateDialog.propTypes = {
  plan: PropTypes.shape({ label: PropTypes.string }),
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
