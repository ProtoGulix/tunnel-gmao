/**
 * @fileoverview Détail de la ligne choisie dans la file : demande, intervention ou échéance
 * préventive (ouvre sa demande ou son intervention liée, sinon fiche courte).
 * @module components/home/QueueDetail
 */
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import InterventionRequestDetail from '@/components/intervention-requests/InterventionRequestDetail';
import InterventionDetailPanel from '@/components/interventions/InterventionDetailPanel';
import AnticipatePlanButton from '@/components/equipements/AnticipatePlanButton';
import { canAcceptRequest, preventiveAction } from '@/hooks/home/requestQueue';

function RequestDetail({ id, request, onAccept, onChanged }) {
  return (
    <>
      {canAcceptRequest(request) && (
        <Flex justify="end" px="3" pt="3">
          <Button size="1" onClick={() => onAccept(request)}>Accepter</Button>
        </Flex>
      )}
      <InterventionRequestDetail
        key={id}
        requestId={id}
        onTransitionDone={onChanged}
        onDeleted={onChanged}
      />
    </>
  );
}
RequestDetail.propTypes = {
  id: PropTypes.string.isRequired,
  request: PropTypes.object,
  onAccept: PropTypes.func.isRequired,
  onChanged: PropTypes.func.isRequired,
};

function PreventiveSheet({ row, canLaunch, busy, onLaunch }) {
  return (
    <Box p="3">
      <Flex direction="column" gap="2">
        <Text size="3" weight="bold">{row.plan_label || row.plan_code}</Text>
        <Text size="2">{[row.machine_code, row.machine_name].filter(Boolean).join(' - ')}</Text>
        <Flex align="center" gap="2">
          <Text size="2" color="gray">Échéance {row.due_date}</Text>
          {row.state === 'overdue' && <Badge color="red" variant="soft">{row.days_overdue} j de retard</Badge>}
        </Flex>
        {canLaunch && (
          <Box mt="2">
            <AnticipatePlanButton
              plan={{ id: row.plan_id, label: row.plan_label }}
              isPending={busy}
              onConfirm={() => onLaunch(row)}
            />
          </Box>
        )}
      </Flex>
    </Box>
  );
}
PreventiveSheet.propTypes = {
  row: PropTypes.object.isRequired,
  canLaunch: PropTypes.bool,
  busy: PropTypes.bool,
  onLaunch: PropTypes.func.isRequired,
};

/**
 * @param {Object} props
 * @param {{kind: string, id: string}} props.target - clé de sélection analysée
 * @param {Object} [props.row] - ligne de la file, absente pour un lien direct hors file
 * @param {Array} props.requests - demandes à qualifier (transitions permises d'une demande liée)
 */
export default function QueueDetail({ target, row, requests, canAnticipate, anticipate, onAccept, onChanged }) {
  if (target.kind === 'intervention') {
    return <InterventionDetailPanel key={target.id} id={target.id} onDeleted={onChanged} onRefreshList={onChanged} />;
  }
  if (target.kind === 'request') {
    const request = row ?? requests.find((r) => r.id === target.id);
    return <RequestDetail id={target.id} request={request} onAccept={onAccept} onChanged={onChanged} />;
  }
  if (!row) return null;
  const action = preventiveAction(row, canAnticipate);
  if (action.type === 'intervention') {
    return <InterventionDetailPanel key={action.id} id={action.id} onDeleted={onChanged} onRefreshList={onChanged} />;
  }
  if (action.type === 'request') {
    const request = requests.find((r) => r.id === action.id);
    return <RequestDetail id={action.id} request={request} onAccept={onAccept} onChanged={onChanged} />;
  }
  return (
    <PreventiveSheet
      row={row}
      canLaunch={action.type === 'launch'}
      busy={anticipate.pendingKey === `${row.plan_id}:${row.machine_id}`}
      onLaunch={anticipate.anticipate}
    />
  );
}

QueueDetail.propTypes = {
  target: PropTypes.shape({ kind: PropTypes.string.isRequired, id: PropTypes.string.isRequired }).isRequired,
  row: PropTypes.object,
  requests: PropTypes.array.isRequired,
  canAnticipate: PropTypes.bool,
  anticipate: PropTypes.object.isRequired,
  onAccept: PropTypes.func.isRequired,
  onChanged: PropTypes.func.isRequired,
};
