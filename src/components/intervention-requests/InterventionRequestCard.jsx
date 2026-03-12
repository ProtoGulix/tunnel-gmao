/**
 * @fileoverview Bandeau compact d'une demande d'intervention liée.
 * Affiche les infos clés inline ou un empty state si aucune demande n'est liée.
 * @module components/intervention-requests/InterventionRequestCard
 */

import PropTypes from 'prop-types';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { ClipboardList, Link2Off } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * @param {{ request: Object|null }} props
 */
export default function InterventionRequestCard({ request }) {
  if (!request) {
    return (
      <EmptyState
        compact
        icon={<Link2Off size={16} />}
        title="Aucune demande liée"
        description="Intervention créée manuellement, sans demande associée."
      />
    );
  }

  return (
    <Box
      style={{
        borderRadius: 'var(--radius-3)',
        border: '1px solid var(--gray-4)',
        borderLeft: `4px solid ${request.statutColor}`,
        background: 'var(--gray-1)',
        overflow: 'hidden',
      }}
    >
      <Flex align="center" gap="3" px="4" py="3" wrap="wrap">
        <ClipboardList size={14} color="var(--gray-9)" style={{ flexShrink: 0 }} />

        <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--accent-11)', flexShrink: 0 }}>
          {request.code}
        </Text>

        <Badge
          variant="soft"
          size="1"
          radius="full"
          style={{ backgroundColor: request.statutColor + '22', color: request.statutColor, flexShrink: 0 }}
        >
          {request.statutLabel}
        </Badge>

        <Text size="2" weight="medium" style={{ flexShrink: 0 }}>{request.demandeurNom}</Text>

        {request.demandeurService && (
          <Text size="2" color="gray" style={{ flexShrink: 0 }}>— {request.demandeurService}</Text>
        )}

        <Text
          size="2"
          color="gray"
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
        >
          {request.description}
        </Text>

        <Text size="1" color="gray" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          {formatDate(request.createdAt)}
        </Text>
      </Flex>
    </Box>
  );
}

InterventionRequestCard.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    demandeurNom: PropTypes.string.isRequired,
    demandeurService: PropTypes.string,
    description: PropTypes.string.isRequired,
    statutLabel: PropTypes.string.isRequired,
    statutColor: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
  }),
};
