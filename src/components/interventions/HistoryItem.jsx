/**
 * Item d'historique compact sur une ligne
 * Format: date · type · badges · utilisateur
 */

import { Flex, Text, Badge } from '@radix-ui/themes';
import PropTypes from 'prop-types';
import { STATE_COLORS } from '@/config/interventionTypes';

/**
 * Formate une date ISO en français
 */
const formatDateFR = (iso) => new Date(iso).toLocaleString('fr-FR');

/**
 * Construit le label utilisateur
 */
const buildUserLabel = (tech) => {
  if (!tech) return '';
  return `${(tech.firstName || '').trim()} ${(tech.lastName || '').trim()}`.trim();
};

/**
 * Rend un badge de catégorie d'action
 */
function renderActionBadge(subcategory) {
  const label = subcategory?.code || subcategory?.label;
  if (!label) return null;
  return (
    <Badge size="1" variant="soft" color="blue">
      {label}
    </Badge>
  );
}

/**
 * Rend la transition de statut
 */
/* eslint-disable complexity */
function renderStatusTransition(fromDetail, toDetail) {
  const parts = [];

  if (fromDetail) {
    const fromKey = fromDetail.id || 'ouvert';
    const fromCfg = STATE_COLORS[fromKey];
    if (fromCfg) {
      parts.push(
        <Badge
          key="from"
          size="1"
          variant="soft"
          style={{
            backgroundColor: fromCfg.activeBg || 'var(--gray-6)',
            color: fromCfg.textActive || 'white',
          }}
        >
          {fromCfg.label}
        </Badge>
      );
    }
  }

  if (fromDetail && toDetail) {
    parts.push(
      <Text key="arrow" size="2" style={{ margin: '0 4px' }}>
        →
      </Text>
    );
  }

  if (toDetail) {
    const toKey = toDetail.id || 'ouvert';
    const toCfg = STATE_COLORS[toKey];
    if (toCfg) {
      parts.push(
        <Badge
          key="to"
          size="1"
          variant="solid"
          style={{
            backgroundColor: toCfg.activeBg || 'var(--blue-6)',
            color: toCfg.textActive || 'white',
          }}
        >
          {toCfg.label}
        </Badge>
      );
    }
  }

  return parts.length ? <span>{parts}</span> : null;
}

/**
 * Composant HistoryItem - ligne compacte d'historique
 */
export default function HistoryItem({ item }) {
  const isAction = item.type === 'action';
  const parts = [];

  // Date
  parts.push(
    <Text key="date" size="2" color="gray">
      {formatDateFR(item.date)}
    </Text>
  );
  parts.push(
    <Text key="sep1" size="2">
      ·
    </Text>
  );

  // Type et badge
  if (isAction) {
    parts.push(
      <Text key="type" size="2">
        Action
      </Text>
    );
    const actionBadge = renderActionBadge(item.data?.subcategory);
    if (actionBadge) {
      parts.push(
        <Text key="sep2" size="2">
          ·
        </Text>
      );
      parts.push(<span key="badge">{actionBadge}</span>);
    }
  } else {
    const statusTransition = renderStatusTransition(
      item.data?.status_from_detail,
      item.data?.status_to_detail
    );
    if (statusTransition) {
      parts.push(<span key="status">{statusTransition}</span>);
    } else {
      parts.push(
        <Text key="type" size="2">
          Changement statut
        </Text>
      );
    }
  }

  // Utilisateur
  const user = buildUserLabel(item.data?.technician);
  if (user) {
    parts.push(
      <Text key="sep3" size="2">
        ·
      </Text>
    );
    parts.push(
      <Text key="user" size="2" color="gray">
        {user}
      </Text>
    );
  }

  return (
    <Flex align="center" gap="2" mb="2">
      {parts}
    </Flex>
  );
}

HistoryItem.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.oneOf(['action', 'status']).isRequired,
    date: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
  }).isRequired,
};
