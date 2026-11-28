/**
 * @fileoverview Ligne d'une demande à trancher : titre (ouvre la demande), repères, boutons
 * selon les transitions permises par l'API.
 * @module components/home/DecisionRow
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge, Button, Flex, Text } from '@radix-ui/themes';
import { entityCodeUrl } from '@/components/shared/entityCodeUrl';
import { ageInDays, canTransition, equipmentLabel } from '@/hooks/home/decisionQueue';

// Titre sur deux lignes au plus : une description de constat peut tenir un paragraphe
const CLAMP = { fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };

export default function DecisionRow({ request, onAccept, onHold, onReject }) {
  const [busy, setBusy] = useState(false);
  const run = async (action) => {
    setBusy(true);
    try { await action(request); } finally { setBusy(false); }
  };
  const meta = [request.code, equipmentLabel(request.equipement), `${ageInDays(request.created_at)} j`].filter(Boolean).join(', ');
  return (
    <Flex
      asChild direction="column" gap="2" py="3"
      style={{ borderBottom: '1px solid var(--gray-4)' }}
    >
      <article>
        <div>
          <Flex align="center" gap="2" wrap="wrap">
            <Link to={entityCodeUrl('intervention_request', request.id)} title={request.description} style={CLAMP}>
              {request.description || request.code || 'Demande'}
            </Link>
            {request.priorite === 'urgent' && <Badge color="red" variant="soft">Urgente</Badge>}
          </Flex>
          <Text as="div" size="1" color="gray">{meta}</Text>
        </div>
        <Flex gap="2" wrap="wrap">
          {canTransition(request, 'acceptee') && <Button size="2" disabled={busy} onClick={() => onAccept(request)}>Accepter</Button>}
          {canTransition(request, 'en_attente') && (
            <Button size="2" variant="soft" disabled={busy} onClick={() => run(onHold)}>En attente</Button>
          )}
          {canTransition(request, 'rejetee') && (
            <Button size="2" variant="soft" color="orange" disabled={busy} onClick={() => run(onReject)}>Rejeter</Button>
          )}
        </Flex>
      </article>
    </Flex>
  );
}

DecisionRow.propTypes = {
  request: PropTypes.object.isRequired,
  onAccept: PropTypes.func.isRequired,
  onHold: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};
