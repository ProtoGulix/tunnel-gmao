/**
 * Constats d'une intervention : liste, ajout, correction (motif demandé par la fenêtre commune).
 * Le backend décide des droits (`can_correct`) et de l'archivage.
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Button, Card, Flex, Text } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import ConstatDialog from './ConstatDialog';
import { choicesOf } from './constatRules';
import { createConstat, correctConstat } from '@/api/constats';
import { useInterventionRequestStatuses } from '@/hooks/shared/useInterventionRequestStatuses';

function ConstatCard({ constat, onCorrect }) {
  const { labelMap, colorMap } = useInterventionRequestStatuses();
  const author = [constat.author_first_name, constat.author_last_name].filter(Boolean).join(' ');
  return (
    <Card>
      <Flex direction="column" gap="2" p="2">
        <Flex align="center" gap="2" wrap="wrap">
          <Text size="2" weight="bold">{constat.machine_code} {constat.machine_name}</Text>
          {constat.request_code && <Badge variant="outline" color="gray" style={{ fontFamily: 'monospace' }}>{constat.request_code}</Badge>}
          {constat.request_status && (
            <Badge variant="soft" color={colorMap[constat.request_status] ?? 'gray'}>
              {labelMap[constat.request_status] ?? constat.request_status}
            </Badge>
          )}
          {constat.linked_request_code && <Badge variant="soft" color="gray">Rattaché à {constat.linked_request_code}</Badge>}
          {constat.can_correct && (
            <Button size="1" variant="soft" ml="auto" onClick={() => onCorrect(constat)}>Corriger</Button>
          )}
        </Flex>
        <Flex gap="1" wrap="wrap">
          {constat.answers.map((a) => <Badge key={a.choice_code} variant="soft" color="blue">{a.label}</Badge>)}
        </Flex>
        <Text size="1" color="gray">
          {[author, constat.created_at && new Date(constat.created_at).toLocaleString('fr-FR')].filter(Boolean).join(' - ')}
        </Text>
      </Flex>
    </Card>
  );
}

ConstatCard.propTypes = { constat: PropTypes.object.isRequired, onCorrect: PropTypes.func.isRequired };

export default function ConstatsList({ interventionId, constats, machine, canAdd, onChanged }) {
  const [dialog, setDialog] = useState(null); // { constat? } | null
  const edited = dialog?.constat;
  const initial = edited
    ? { choices: choicesOf(edited), machine: { id: String(edited.machine_id), name: edited.machine_name } }
    : { choices: [], machine };
  const submit = async (payload) => {
    await (edited ? correctConstat(edited.id, payload) : createConstat(interventionId, payload));
    await onChanged?.();
  };

  return (
    <Flex direction="column" gap="3" pt="4" pb="4">
      <Flex align="center" justify="between">
        <Text size="4" weight="bold">Constats</Text>
        {canAdd && <Button size="2" onClick={() => setDialog({})}><Plus size={14} /> Ajouter</Button>}
      </Flex>
      {constats?.length === 0 && <Text size="2" color="gray">Aucun constat</Text>}
      {(constats ?? []).map((c) => <ConstatCard key={c.id} constat={c} onCorrect={(constat) => setDialog({ constat })} />)}
      {dialog && (
        <ConstatDialog
          title={edited ? 'Corriger le constat' : 'Nouveau constat'}
          submitLabel={edited ? 'Corriger' : 'Enregistrer'}
          initialChoices={initial.choices}
          initialMachine={initial.machine}
          onSubmit={submit}
          onClose={() => setDialog(null)}
        />
      )}
    </Flex>
  );
}

ConstatsList.propTypes = {
  interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  constats: PropTypes.array,
  machine: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
  canAdd: PropTypes.bool,
  onChanged: PropTypes.func,
};
