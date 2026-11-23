/**
 * Constats d'une intervention : liste, ajout, correction (motif demandé par la fenêtre commune).
 * Le backend décide des droits (`can_correct`) et de l'archivage.
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Flex, Text } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import ConstatDialog from './ConstatDialog';
import ConstatAnswers from './ConstatAnswers';
import { choicesOf, requestState } from './constatRules';
import RequestStatusBadge from '@/components/shared/RequestStatusBadge';
import { EntityCodeLink } from '@/components/shared/EntityCodeLink';
import { createConstat, correctConstat } from '@/api/constats';
import { useInterventionRequestStatuses } from '@/hooks/shared/useInterventionRequestStatuses';

/** Auteur et date de la décision sur la demande (journal d'audit). */
function decisionBy(constat) {
  const at = constat.request_status_at
    && new Date(constat.request_status_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  return [constat.request_status_by, at].filter(Boolean).join(' — ');
}

function requestRow(constat, statusLabel, statusColor) {
  return {
    key: 'request',
    label: 'Demande liée',
    value: (
      <Flex gap="2" align="center" wrap="wrap">
        {constat.request_code && (
          <EntityCodeLink type="intervention_request" id={constat.request_id} code={constat.request_code} size={1} />
        )}
        {constat.request_status && <RequestStatusBadge label={statusLabel} color={statusColor} />}
      </Flex>
    ),
  };
}

function reasonRow(constat, refused) {
  return {
    key: 'reason',
    label: refused ? 'Motif du rejet' : 'Motif',
    value: (
      <Flex gap="2" align="baseline" wrap="wrap">
        <Text size="2" weight="medium" color={refused ? 'red' : undefined}>{constat.request_status_reason}</Text>
        <Text size="1" color="gray">{decisionBy(constat)}</Text>
      </Flex>
    ),
  };
}

function commentRow(constat) {
  return {
    key: 'comment',
    label: 'Commentaire',
    value: <Text size="2" style={{ whiteSpace: 'pre-wrap' }}>{constat.request_status_comment}</Text>,
  };
}

/** Suite donnée : intervention créée ou idée rattachée. */
function nextRow(state) {
  const accepted = state.kind === 'accepted';
  return {
    key: 'next',
    label: accepted ? 'Intervention créée' : 'Rattachée à l\'idée',
    value: state.id
      ? <EntityCodeLink type={accepted ? 'intervention' : 'intervention_request'} id={state.id} code={state.code} size={1} />
      : <Text size="2">{state.code}</Text>,
  };
}

/** Lignes « demande liée » de la carte : demande, motif audité, commentaire, suite donnée. */
function requestRows(constat, statusLabel, statusColor) {
  const state = requestState(constat);
  const kind = state?.kind;
  const refused = kind === 'rejected' || kind === 'linked';
  const hasNext = (kind === 'accepted' || kind === 'linked') && state.code;
  return [
    requestRow(constat, statusLabel, statusColor),
    constat.request_status_reason && reasonRow(constat, refused),
    constat.request_status_comment && commentRow(constat),
    hasNext && nextRow(state),
  ].filter(Boolean);
}

function ConstatCard({ constat, number, interventionMachineId, onCorrect }) {
  const { labelMap, colorMap } = useInterventionRequestStatuses();
  const author = [constat.author_first_name, constat.author_last_name].filter(Boolean).join(' ');
  const date = constat.created_at && new Date(constat.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const statusLabel = constat.request_status_label ?? labelMap[constat.request_status] ?? constat.request_status;
  const statusColor = constat.request_status_color ?? colorMap[constat.request_status];
  const otherMachine = interventionMachineId && String(constat.machine_id) !== String(interventionMachineId);
  // Le cadre prend la couleur du statut de la demande, comme les listes
  const frame = statusColor ? { borderLeft: `4px solid ${statusColor}` } : undefined;
  return (
    <Card style={frame}>
      <Flex direction="column" gap="3" p="2">
        <Flex align="center" gap="2" wrap="wrap">
          <Text size="2" weight="bold">Constat {number}</Text>
          <Text size="1" color="gray">{[author, date].filter(Boolean).join(' — ')}</Text>
          {constat.can_correct && (
            <Button size="1" variant="soft" ml="auto" onClick={() => onCorrect(constat)}>Corriger</Button>
          )}
        </Flex>
        {otherMachine && (
          <Text size="2">Équipement visé : <Text weight="bold">{constat.machine_code}</Text> {constat.machine_name}</Text>
        )}
        <ConstatAnswers answers={constat.answers} after={requestRows(constat, statusLabel, statusColor)} />
      </Flex>
    </Card>
  );
}

ConstatCard.propTypes = {
  constat: PropTypes.object.isRequired,
  number: PropTypes.number.isRequired,
  interventionMachineId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCorrect: PropTypes.func.isRequired,
};

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
      {(constats ?? []).map((c, i) => <ConstatCard key={c.id} constat={c} number={i + 1} interventionMachineId={machine?.id} onCorrect={(constat) => setDialog({ constat })} />)}
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
