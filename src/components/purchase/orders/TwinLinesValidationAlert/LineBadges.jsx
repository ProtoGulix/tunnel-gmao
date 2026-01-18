/**
 * @fileoverview Badges pour une ligne de commande
 * @module components/purchase/orders/TwinLinesValidationAlert/LineBadges
 */

import PropTypes from 'prop-types';
import { Badge } from '@radix-ui/themes';
import { Check, Circle, Clock } from 'lucide-react';
import { getSelectionBadgeColor, getQuoteBadgeColor, getStatusBadgeColor } from './helpers';

/**
 * Affiche les badges d'une ligne (sélection, devis, statut)
 * @component
 * @param {Object} props
 * @param {boolean} props.isSelected - Si la ligne est sélectionnée
 * @param {boolean} props.quoteReceived - Si le devis est reçu
 * @param {string} props.status - Statut de la commande
 */
export default function LineBadges({ isSelected, quoteReceived, status }) {
  return (
    <>
      <Badge 
        color={getSelectionBadgeColor(isSelected)} 
        size="1"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        {isSelected ? <Check size={12} /> : <Circle size={12} />}
        {isSelected ? 'Sélectionnée' : 'Non sélectionnée'}
      </Badge>
      <Badge 
        color={getQuoteBadgeColor(quoteReceived)} 
        size="1"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        {quoteReceived ? <Check size={12} /> : <Clock size={12} />}
        {quoteReceived ? 'Devis reçu' : 'Devis en attente'}
      </Badge>
      <Badge color={getStatusBadgeColor(status)} size="1">
        {status}
      </Badge>
    </>
  );
}

LineBadges.propTypes = {
  isSelected: PropTypes.bool.isRequired,
  quoteReceived: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired,
};
