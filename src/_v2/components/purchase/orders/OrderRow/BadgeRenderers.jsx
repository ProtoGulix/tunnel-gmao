/**
 * @fileoverview Badges pour OrderRow
 * @module components/purchase/orders/OrderRow/BadgeRenderers
 */

import { Badge, Flex } from '@radix-ui/themes';
import { AlertTriangle } from 'lucide-react';
import { URGENCY_LEVELS } from '@/config/stockManagementConfig';

/**
 * Badge pour le comptage des lignes
 * @component
 * @param {number} lineCount - Nombre de lignes
 */
export function LineCountBadge({ lineCount }) {
  return (
    <Badge color="gray" variant="soft">
      {lineCount} ligne{lineCount > 1 ? 's' : ''}
    </Badge>
  );
}

/**
 * Badge pour l'âge de la commande
 * @component
 * @param {number|null} ageDays - Âge en jours
 * @param {string} ageColor - Couleur Radix UI
 */
export function AgeBadge({ ageDays, ageColor }) {
  return (
    <Badge color={ageColor} variant="soft">
      {ageDays != null ? `${ageDays} j` : '—'}
    </Badge>
  );
}

/**
 * Badge pour l'urgence
 * @component
 * @param {string} urgencyLevel - Niveau d'urgence
 */
export function UrgencyBadge({ urgencyLevel }) {
  const urgencyConfig = URGENCY_LEVELS.find(u => u.value === urgencyLevel);
  if (!urgencyConfig || urgencyConfig.value === 'all') {
    return <Badge color="gray" variant="soft">Inconnue</Badge>;
  }
  return (
    <Badge color={urgencyConfig.color} variant={urgencyConfig.variant}>
      {urgencyConfig.label}
    </Badge>
  );
}

/**
 * Badge de blocage (commande > 7 jours)
 * @component
 * @param {boolean} isBlocking - Si blocage
 */
export function BlockingBadge({ isBlocking }) {
  if (!isBlocking) return null;
  return (
    <Badge color="red" size="1">
      <Flex align="center" gap="1">
        <AlertTriangle size={12} />
        &gt;7j
      </Flex>
    </Badge>
  );
}
