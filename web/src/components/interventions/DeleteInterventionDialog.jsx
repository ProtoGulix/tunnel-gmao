/**
 * Fenêtre de suppression d'une intervention (ADR 0019) : la fenêtre de motif commune
 * (AuditReasonDialog, motifs « deleted ») avec, si une demande est liée, le choix obligatoire
 * de son issue : la rouvrir ou la supprimer aussi. Sans demande (intervention ancienne),
 * aucun choix. Le backend reste seul juge : il refuse (400) ce qui n'est pas permis.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, RadioGroup, Text } from '@radix-ui/themes';
import AuditReasonDialog from '@/components/ui/AuditReasonDialog';
import { DECISION_DELETED } from '@/lib/api/auditReasonFilter';
import {
  OUTCOME_DELETE,
  OUTCOME_REOPEN,
  getRequestOutcomeOptions,
} from './deleteInterventionRules';

function RequestOutcomeChoice({ request, options, outcome, onChange }) {
  return (
    <Flex direction="column" gap="2" mb="4">
      <Text as="div" size="1" weight="bold">
        La demande {request.code} <Text color="red">*</Text>
      </Text>
      <RadioGroup.Root value={outcome} onValueChange={onChange}>
        <RadioGroup.Item value={OUTCOME_REOPEN}>Rouvrir la demande</RadioGroup.Item>
        <RadioGroup.Item value={OUTCOME_DELETE} disabled={!options.canDeleteRequest}>
          Supprimer aussi la demande
        </RadioGroup.Item>
      </RadioGroup.Root>
      {options.deleteRequestHint && (
        <Text size="1" color="gray">{options.deleteRequestHint}</Text>
      )}
    </Flex>
  );
}

RequestOutcomeChoice.propTypes = {
  request: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
  outcome: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default function DeleteInterventionDialog({ open, code, request, saving, onConfirm, onCancel }) {
  const [outcome, setOutcome] = useState('');
  const options = getRequestOutcomeOptions(request);

  const handleCancel = () => {
    setOutcome('');
    onCancel();
  };

  const handleConfirm = (reason) => {
    onConfirm({ reason, outcome: options.needsChoice ? outcome : null });
  };

  return (
    <AuditReasonDialog
      open={open}
      entityType="intervention"
      decisionType={DECISION_DELETED}
      title="Supprimer l'intervention"
      description={`Supprimer ${code ?? "l'intervention"} ? Cette action est irréversible.`}
      canConfirm={!options.needsChoice || !!outcome}
      saving={saving}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    >
      {options.needsChoice && (
        <RequestOutcomeChoice request={request} options={options} outcome={outcome} onChange={setOutcome} />
      )}
    </AuditReasonDialog>
  );
}

DeleteInterventionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  code: PropTypes.string,
  request: PropTypes.object,
  saving: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
