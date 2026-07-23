/**
 * @fileoverview Item de la liste maître des demandes d'intervention (vue master-detail)
 * @module components/intervention-requests/InterventionRequestListItem
 */

import PropTypes from 'prop-types';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { Bot, User } from 'lucide-react';

function formatDay(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RequestHeaderRow({ request }) {
  return (
    <Flex align="center" justify="between" gap="2" mb="1">
      <Flex align="center" gap="2" style={{ minWidth: 0, overflow: 'hidden' }}>
        <Text size="1" color="gray" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
          {request.code}
        </Text>
        {request.equipement?.code && (
          <Badge variant="solid" color="gray" size="1" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
            {request.equipement.code}
          </Badge>
        )}
      </Flex>
      <Badge
        size="1"
        variant="soft"
        style={{ backgroundColor: (request.statut_color || '#888') + '22', color: request.statut_color || '#888', flexShrink: 0 }}
      >
        {request.statut_label}
      </Badge>
    </Flex>
  );
}
RequestHeaderRow.propTypes = { request: PropTypes.object.isRequired };

function RequestDemandeurRow({ request }) {
  const DemandeurIcon = request.is_system ? Bot : User;
  return (
    <Flex align="center" gap="1" style={{ minWidth: 0 }}>
      <DemandeurIcon size={13} color="var(--gray-9)" style={{ flexShrink: 0 }} />
      <Text
        size="2"
        weight="bold"
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
      >
        {request.demandeur_nom}
      </Text>
      {(request.service?.label || request.demandeur_service) && (
        <Text size="1" color="gray" style={{ flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          — {request.service?.label ?? request.demandeur_service}
        </Text>
      )}
      <Text size="1" color="gray" style={{ marginLeft: 'auto', flexShrink: 0, paddingLeft: 8 }}>
        {formatDay(request.created_at)}
      </Text>
    </Flex>
  );
}
RequestDemandeurRow.propTypes = { request: PropTypes.object.isRequired };

export default function InterventionRequestListItem({ request, isSelected, onClick }) {
  return (
    <Box
      px="3" py="2"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid var(--gray-4)',
        background: isSelected ? 'var(--blue-2)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--blue-9)' : `3px solid ${request.statut_color || 'var(--gray-6)'}`,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <RequestHeaderRow request={request} />
      <RequestDemandeurRow request={request} />
      <Text
        size="1"
        color="gray"
        style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {request.description}
      </Text>
    </Box>
  );
}

InterventionRequestListItem.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    statut_label: PropTypes.string,
    statut_color: PropTypes.string,
    demandeur_nom: PropTypes.string,
    demandeur_service: PropTypes.string,
    service: PropTypes.shape({ label: PropTypes.string }),
    description: PropTypes.string,
    created_at: PropTypes.string,
    is_system: PropTypes.bool,
    equipement: PropTypes.shape({ code: PropTypes.string, name: PropTypes.string }),
  }).isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
};
