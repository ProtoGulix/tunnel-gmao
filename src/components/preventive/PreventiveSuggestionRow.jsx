/**
 * @fileoverview Ligne de tableau pour une préconisation préventive
 */

import PropTypes from 'prop-types';
import { Flex, Box, Table, Text, Badge, Button } from '@radix-ui/themes';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

const STATUS_DISPLAY = {
  NEW: { label: 'En attente', color: 'blue' },
  REVIEWED: { label: 'Examinée', color: 'gray' },
  ACCEPTED: { label: 'Acceptée', color: 'green' },
  REJECTED: { label: 'Rejetée', color: 'red' },
};

const formatDateFR = (isoDate) => {
  try {
    return new Date(isoDate).toLocaleDateString('fr-FR');
  } catch {
    return 'N/A';
  }
};

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'ACCEPTED':
      return <CheckCircle size={16} style={{ color: 'var(--color-green-9)' }} />;
    case 'REJECTED':
      return <XCircle size={16} style={{ color: 'var(--color-red-9)' }} />;
    default:
      return <AlertCircle size={16} style={{ color: 'var(--color-blue-9)' }} />;
  }
};

StatusIcon.propTypes = {
  status: PropTypes.string.isRequired,
};

/**
 * Ligne de tableau pour une préconisation
 */
export default function PreventiveSuggestionRow({
  suggestion,
  onAccept,
  onReject,
  onGoToMachine,
  processing,
}) {
  return (
    <Table.Row>
      <Table.Cell>
        <Flex gap="2" align="center">
          <StatusIcon status={suggestion.status} />
          <Badge color={STATUS_DISPLAY[suggestion.status]?.color || 'blue'} size="1">
            {STATUS_DISPLAY[suggestion.status]?.label || suggestion.status}
          </Badge>
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onGoToMachine(suggestion.machine?.id || suggestion.machineId)}
        >
          <Flex gap="1" align="center">
            <Text>{suggestion.machine?.name || 'Machine'}</Text>
            <ExternalLink size={12} />
          </Flex>
        </Button>
      </Table.Cell>
      <Table.Cell>
        <Box>
          <Text weight="bold" size="sm">
            {suggestion.preventiveLabel}
          </Text>
          <Text color="gray" size="xs">
            {suggestion.preventiveCode}
          </Text>
        </Box>
      </Table.Cell>
      <Table.Cell>
        <Badge color="gray" variant="soft">
          {suggestion.score}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <Text size="sm">{formatDateFR(suggestion.detectedAt)}</Text>
      </Table.Cell>
      <Table.Cell>
        {suggestion.status === 'NEW' && (
          <Flex gap="2">
            <Button
              onClick={() => onReject(suggestion.id)}
              disabled={processing}
              color="gray"
              variant="soft"
              size="sm"
            >
              {processing ? '...' : 'Rejeter'}
            </Button>
            <Button
              onClick={() => onAccept(suggestion.id)}
              disabled={processing}
              color="green"
              size="sm"
            >
              {processing ? '...' : 'Accepter'}
            </Button>
          </Flex>
        )}
        {suggestion.status !== 'NEW' && (
          <Text size="xs" color="gray">
            Traité
          </Text>
        )}
      </Table.Cell>
    </Table.Row>
  );
}

PreventiveSuggestionRow.propTypes = {
  suggestion: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    machine_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      }),
    ]).isRequired,
    preventive_label: PropTypes.string.isRequired,
    preventive_code: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    detected_at: PropTypes.string.isRequired,
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onGoToMachine: PropTypes.func.isRequired,
  processing: PropTypes.bool.isRequired,
};
