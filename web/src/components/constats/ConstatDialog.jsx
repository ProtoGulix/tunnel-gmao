/**
 * Fenêtre de saisie d'un constat (ajout, correction, clôture depuis l'en-tête).
 * `onSubmit(payload)` appelle l'API ; son refus s'affiche ici. Un motif d'audit manquant
 * est demandé par la fenêtre commune (auditGuard) : une annulation ne fait rien.
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Callout, Dialog, Flex } from '@radix-ui/themes';
import ConstatForm from './ConstatForm';
import { useConstatQuestions } from '@/hooks/constats/useConstats';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function ConstatDialog({ title, submitLabel, initialChoices, initialMachine, onSubmit, onClose }) {
  const { questions, error: loadError } = useConstatQuestions();
  const [choices, setChoices] = useState(initialChoices ?? []);
  const [machine, setMachine] = useState(initialMachine ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await onSubmit({ choices, machine_id: machine?.id ?? null });
      onClose();
    } catch (err) {
      if (!err?.isAuditCancelled) setError(extractApiErrorMessage(err, 'Enregistrement impossible'));
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <Dialog.Content maxWidth="560px">
        <Dialog.Title size="3">{title}</Dialog.Title>
        {loadError && <Callout.Root color="red" size="1" mb="3"><Callout.Text>Questions indisponibles</Callout.Text></Callout.Root>}
        <ConstatForm
          questions={questions}
          choices={choices}
          machine={machine}
          onChoicesChange={setChoices}
          onMachineChange={setMachine}
        />
        {error && (
          <Callout.Root color="red" size="1" mt="3" role="alert"><Callout.Text>{error}</Callout.Text></Callout.Root>
        )}
        <Flex gap="2" justify="end" mt="4">
          <Button variant="soft" color="gray" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={submit} disabled={saving || !questions || choices.length === 0}>
            {saving ? 'En cours...' : submitLabel}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

ConstatDialog.propTypes = {
  title: PropTypes.string.isRequired,
  submitLabel: PropTypes.string.isRequired,
  initialChoices: PropTypes.arrayOf(PropTypes.string),
  initialMachine: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
