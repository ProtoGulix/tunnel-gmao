/**
 * Acceptation d'une demande depuis « À trancher » : le formulaire standard de création
 * d'intervention, demande déjà choisie. La création accepte la demande (ADR 0025).
 * @module components/home/AcceptRequestModal
 */
import PropTypes from 'prop-types';
import { Dialog } from '@radix-ui/themes';
import InterventionCreationPanel from '@/components/planning/InterventionCreationPanel';
import { buildAcceptContext } from '@/lib/acceptRequest';

export default function AcceptRequestModal({ request, onClose, onCreated }) {
  const ctx = request ? buildAcceptContext(request, {
    onCreated: () => { onClose(); onCreated(); },
    onCancel: onClose,
  }) : null;

  return (
    <Dialog.Root open={!!ctx} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Content style={{ maxWidth: 640 }}>
        <Dialog.Title>Accepter la demande</Dialog.Title>
        {ctx && <InterventionCreationPanel key={request.id} ivCreationCtx={ctx} />}
      </Dialog.Content>
    </Dialog.Root>
  );
}

AcceptRequestModal.propTypes = {
  request: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
};
