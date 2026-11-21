/**
 * Fenêtre de création d'intervention (Coordination) : le même composant que l'accueil.
 * @module components/interventions/InterventionCreateModal
 */
import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Flex, Text, VisuallyHidden } from '@radix-ui/themes';
import { Wrench } from 'lucide-react';
import InterventionCreator from '@/components/planning/InterventionCreator';

export default function InterventionCreateModal({ open, onOpenChange, onSuccess }) {
  const handleCreated = useCallback((created) => {
    onSuccess?.(created);
    onOpenChange(false);
  }, [onSuccess, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 1100 }}>
        <VisuallyHidden><Dialog.Title>Nouvelle intervention</Dialog.Title></VisuallyHidden>
        <Flex align="center" gap="2" mb="4">
          <Wrench size={18} color="var(--blue-9)" />
          <Text size="4" weight="bold">Nouvelle intervention</Text>
        </Flex>
        {open && <InterventionCreator onCreated={handleCreated} onCancel={() => onOpenChange(false)} />}
      </Dialog.Content>
    </Dialog.Root>
  );
}

InterventionCreateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
