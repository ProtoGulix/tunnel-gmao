/**
 * @fileoverview Item d'historique simplifié sur une seule ligne.
 * Affiche: date · type (Action | Changement statut) · type d'action (si action) · utilisateur
 *
 * @module components/interventions/InterventionTabs/HistoryItem
 * @requires @radix-ui/themes
 * @requires prop-types
 */

import { Flex, Text, Badge } from "@radix-ui/themes";
import PropTypes from "prop-types";
import { getCategoryColor } from "@/lib/utils/interventionUtils";
import { STATE_COLORS } from "@/config/interventionTypes";

/** Map domain status (open|in_progress|closed|cancelled) to config key */
const mapDtoStatusToConfigKey = (dtoStatus) => {
  // Extract id if status is an object
  const statusId = dtoStatus?.id || dtoStatus;
  
  // statusId should already be in French format from backend
  // Just return it, or fallback to 'ouvert'
  return statusId || "ouvert";
};

/**
 * Item d'historique (ligne compacte)
 *
 * @component
 * @param {Object} props
 * @param {Object} props.item - Élément à afficher
 * @param {('action'|'status')} props.item.type - Type d'item
 * @param {string} props.item.date - Date ISO (horodatage)
 * @param {Object} props.item.data - Données associées
 * @param {Object} [props.item.data.subcategory] - Sous-catégorie d'action
 * @param {string} [props.item.data.subcategory.code] - Code sous-catégorie (ex: DEP)
 * @param {string} [props.item.data.subcategory.name] - Libellé sous-catégorie
 * @param {Object} [props.item.data.technician] - Technicien
 * @param {string} [props.item.data.technician.firstName] - Prénom
 * @param {string} [props.item.data.technician.lastName] - Nom
 * @returns {JSX.Element} Ligne formatée
 *
 * @example
 * <HistoryItem
 *   item={{
 *     type: 'action',
 *     date: new Date().toISOString(),
 *     data: { subcategory: { code: 'DEP' }, technician: { firstName: 'Jean', lastName: 'Dupont' } }
 *   }}
 * />
 */
const formatDateFR = (iso) => new Date(iso).toLocaleString('fr-FR');
const buildUserLabel = (tech) => {
  if (!tech) return '';
  return `${(tech.firstName || '').trim()} ${(tech.lastName || '').trim()}`.trim();
};

function renderActionBadge(subcategory) {
  const label = subcategory?.code || subcategory?.name;
  if (!label) return null;
  return (
    <Badge
      size="1"
      variant="soft"
      style={{
        backgroundColor: getCategoryColor(subcategory) || 'var(--gray-7)',
        color: 'white',
      }}
    >
      {label}
    </Badge>
  );
}

function renderStatusBadge(statusInput) {
  if (!statusInput) return null;
  const deriveKey = (input) => {
    if (typeof input === 'object') {
      if (input.id && STATE_COLORS[input.id]) return input.id;
      if (input.value) return mapDtoStatusToConfigKey(input.value);
      return undefined;
    }
    // string: try direct key first, else map from domain value
    const direct = STATE_COLORS[input];
    if (direct) return input;
    return mapDtoStatusToConfigKey(input);
  };
  const key = deriveKey(statusInput);
  const cfg = key ? STATE_COLORS[key] : undefined;
  if (!cfg) return null;
  return (
    <Badge
      size="1"
      variant="solid"
      style={{ backgroundColor: cfg.activeBg || 'var(--blue-6)', color: cfg.textActive || 'white' }}
    >
      {cfg.label}
    </Badge>
  );
}

function renderStatusTransition(fromInput, toInput) {
  const getCfg = (input) => {
    if (!input) return undefined;
    
    // Si c'est un objet avec un id
    if (typeof input === 'object') {
      const statusId = input.id;
      if (statusId && STATE_COLORS[statusId]) {
        return STATE_COLORS[statusId];
      }
      return undefined;
    }
    
    // Si c'est une string directe
    if (typeof input === 'string') {
      if (STATE_COLORS[input]) {
        return STATE_COLORS[input];
      }
    }
    
    return undefined;
  };
  
  const fromCfg = getCfg(fromInput);
  const toCfg = getCfg(toInput);

  const parts = [];
  if (fromCfg) {
    parts.push(
      <Badge
        key="from"
        size="1"
        variant="soft"
        style={{ backgroundColor: fromCfg.activeBg || 'var(--gray-6)', color: fromCfg.textActive || 'white' }}
      >
        {fromCfg.label}
      </Badge>
    );
  }
  if (fromCfg && toCfg) {
    parts.push(
      <Text key="arrow" size="2" style={{ margin: '0 4px' }}>→</Text>
    );
  }
  if (toCfg) {
    parts.push(
      <Badge
        key="to"
        size="1"
        variant="solid"
        style={{ backgroundColor: toCfg.activeBg || 'var(--blue-6)', color: toCfg.textActive || 'white' }}
      >
        {toCfg.label}
      </Badge>
    );
  }

  return parts.length ? <span>{parts}</span> : null;
}

function getActionSegment(item) {
  return renderActionBadge(item.data?.subcategory) || null;
}

function getStatusSegment(item) {
  console.log('getStatusSegment - item.data:', item.data); // Debug
  console.log('getStatusSegment - from:', item.data?.from, 'to:', item.data?.to); // Debug
  const trans = renderStatusTransition(item.data?.from, item.data?.to);
  console.log('getStatusSegment - trans:', trans); // Debug
  if (trans) return trans;
  const toBadge = renderStatusBadge(item.data?.to);
  if (toBadge) return toBadge;
  return null;
}

function getSegment(item, isAction) {
  if (isAction) return getActionSegment(item);
  return getStatusSegment(item);
}

function buildLineParts(item) {
  const isAction = item.type === 'action';
  const parts = [];
  parts.push(<Text key="date" size="2" color="gray">{formatDateFR(item.date)}</Text>);
  parts.push(<Text key="sep1" size="2">·</Text>);

  const segment = getSegment(item, isAction);
  
  if (isAction) {
    parts.push(<Text key="type" size="2">Action</Text>);
    if (segment) {
      parts.push(<Text key="sep2" size="2">·</Text>);
      parts.push(<span key="segment">{segment}</span>);
    }
  } else {
    // Pour les changements de statut, afficher directement la transition sans le texte "Changement statut"
    if (segment) {
      parts.push(<span key="segment">{segment}</span>);
    } else {
      parts.push(<Text key="type" size="2">Changement statut</Text>);
    }
  }

  const user = buildUserLabel(item.data?.technician);
  if (user) {
    parts.push(<Text key="sep3" size="2">·</Text>);
    parts.push(<Text key="user" size="2" color="gray">{user}</Text>);
  }
  return parts;
}

function HistoryItem({ item }) {
  const parts = buildLineParts(item);
  return (
    <Flex align="center" gap="2" mb="2">{parts}</Flex>
  );
}

HistoryItem.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.oneOf(['action', 'status']).isRequired,
    date: PropTypes.string.isRequired,
    data: PropTypes.shape({
      subcategory: PropTypes.shape({
        code: PropTypes.string,
        name: PropTypes.string,
      }),
      from: PropTypes.shape({
        id: PropTypes.string,
        value: PropTypes.string,
      }),
      to: PropTypes.shape({
        id: PropTypes.string,
        value: PropTypes.string,
      }),
      technician: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
      }),
    }).isRequired,
  }).isRequired
};

export default HistoryItem;
