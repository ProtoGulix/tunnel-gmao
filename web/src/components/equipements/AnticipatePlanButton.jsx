/**
 * @fileoverview Bouton « Lancer en avance » d'un plan, avec confirmation
 * @module components/equipements/AnticipatePlanButton
 */

import PropTypes from 'prop-types';
import { AlertDialog, Button, Callout, Flex } from '@radix-ui/themes';
import { AlertTriangle, FastForward } from 'lucide-react';

export default function AnticipatePlanButton({ plan, isPending, onConfirm }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button size="1" variant="soft" color="blue" disabled={isPending}>
          <FastForward size={13} /> Lancer en avance
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Lancer en avance</AlertDialog.Title>
        <AlertDialog.Description>
          Créer dès maintenant l&apos;intervention préventive <strong>{plan.label}</strong>, sans attendre la prévenance ?
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">Annuler</Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="blue" onClick={() => onConfirm(plan.id)}>Lancer</Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
AnticipatePlanButton.propTypes = {
  plan: PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string }).isRequired,
  isPending: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
};

/** Refus du backend (409 occurrence déjà en cours, 422 plan ou machine non éligible), en clair. */
export function AnticipateError({ message }) {
  if (!message) return null;
  return (
    <Callout.Root color="red" size="1">
      <Callout.Icon><AlertTriangle size={16} /></Callout.Icon>
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}
AnticipateError.propTypes = { message: PropTypes.string };
