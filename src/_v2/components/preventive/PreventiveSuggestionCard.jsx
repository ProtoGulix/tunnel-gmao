/**
 * @fileoverview Carte d'affichage d'une préconisation
 * @module src/components/preventive/PreventiveSuggestionCard
 */

import PropTypes from 'prop-types';
import { Box, Flex, Card, Text, Button } from '@radix-ui/themes';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_DISPLAY = {
  NEW: { label: 'En attente', color: 'blue' },
  REVIEWED: { label: 'Examinée', color: 'gray' },
  ACCEPTED: { label: 'Acceptée', color: 'green' },
  REJECTED: { label: 'Rejetée', color: 'red' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Composant Principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carte d'affichage d'une préconisation préventive
 *
 * @component
 * @param {Object} props
 * @param {Object} props.suggestion - Préconisation
 * @param {Function} props.onAccept - Callback acceptation
 * @param {Function} props.onReject - Callback rejet
 * @param {boolean} props.processing - Traitement en cours
 * @returns {JSX.Element}
 */
export default function PreventiveSuggestionCard({ suggestion, onAccept, onReject, processing }) {
  return (
    <Card
      color={STATUS_DISPLAY[suggestion.status]?.color || 'blue'}
      mb="3"
    >
      {/* Header */}
      <Flex justify="between" align="start" mb="2">
        <Flex gap="2" align="start" style={{ flex: 1 }}>
          <Box pt="1">
            <StatusIcon status={suggestion.status} />
          </Box>
          <Box style={{ flex: 1 }}>
            <Text weight="bold" size="sm">
              {suggestion.preventive_label}
            </Text>
            <Text color="gray" size="xs" mt="1">
              {suggestion.preventive_code} • Score: {suggestion.score}
            </Text>
          </Box>
        </Flex>
      </Flex>

      {/* Détails */}
      <Flex gap="4" mb="3" wrap="wrap">
        <Box>
          <Text color="gray" size="xs">
            Détecté
          </Text>
          <Text size="sm">{formatDateFR(suggestion.detected_at)}</Text>
        </Box>
        {suggestion.handled_at && (
          <Box>
            <Text color="gray" size="xs">
              Traité
            </Text>
            <Text size="sm">{formatDateFR(suggestion.handled_at)}</Text>
          </Box>
        )}
      </Flex>

      {/* Buttons (seulement si NEW) */}
      {suggestion.status === 'NEW' && (
        <Flex gap="2" justify="end">
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

      {/* Status badge (si pas NEW) */}
      {suggestion.status !== 'NEW' && (
        <Text size="xs" color="gray">
          Statut: {STATUS_DISPLAY[suggestion.status]?.label || suggestion.status}
        </Text>
      )}
    </Card>
  );
}

PreventiveSuggestionCard.propTypes = {
  suggestion: PropTypes.shape({
    id: PropTypes.string.isRequired,
    preventive_label: PropTypes.string.isRequired,
    preventive_code: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    detected_at: PropTypes.string.isRequired,
    handled_at: PropTypes.string,
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  processing: PropTypes.bool.isRequired,
};
