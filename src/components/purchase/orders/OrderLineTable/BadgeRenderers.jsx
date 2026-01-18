/**
 * @fileoverview Badges pour OrderLineTable
 * @module components/purchase/orders/OrderLineTable/BadgeRenderers
 */

import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';
import { Link2 } from 'lucide-react';
import { URGENCY_LEVELS } from '@/config/stockManagementConfig';

/**
 * Badge pour le comptage des DA
 * @component
 */
export function PurchaseRequestBadge({ prCount }) {
  return (
    <Badge color="blue" variant="soft" size="1">
      {prCount} DA{prCount > 1 ? 's' : ''}
    </Badge>
  );
}

PurchaseRequestBadge.propTypes = {
  prCount: PropTypes.number.isRequired,
};

/**
 * Badge pour afficher les lignes jumelles
 * @component
 */
export function TwinLinesBadge({ twinCount, totalLines }) {
  if (twinCount === 0) return null;
  
  return (
    <Badge color="amber" variant="soft" size="1" title={`${totalLines} fournisseurs au total`}>
      <Flex align="center" gap="1">
        <Link2 size={12} />
        {twinCount} jumelle{twinCount > 1 ? 's' : ''}
      </Flex>
    </Badge>
  );
}

TwinLinesBadge.propTypes = {
  twinCount: PropTypes.number.isRequired,
  totalLines: PropTypes.number.isRequired,
};

/**
 * Badge pour l'urgence d'une ligne
 * @component
 */
export function UrgencyBadge({ urgency }) {
  const urgencyConfig = URGENCY_LEVELS.find(u => u.value === urgency);
  if (!urgencyConfig || urgencyConfig.value === 'all') {
    return <Badge color="gray" variant="soft">Inconnue</Badge>;
  }
  return (
    <Badge color={urgencyConfig.color} variant={urgencyConfig.variant} size="1">
      {urgencyConfig.label}
    </Badge>
  );
}

UrgencyBadge.propTypes = {
  urgency: PropTypes.string,
};

/**
 * Affichage des demandeurs
 * @component
 */
export function RequestersList({ requesters }) {
  const visible = requesters.slice(0, 2);
  const extra = requesters.length - visible.length;

  return (
    <Flex direction="column" gap="1">
      {visible.map((name, idx) => (
        <Text key={idx} size="1" color="gray">
          {name}
        </Text>
      ))}
      {extra > 0 && (
        <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
          +{extra} autre{extra > 1 ? 's' : ''}
        </Text>
      )}
    </Flex>
  );
}

RequestersList.propTypes = {
  requesters: PropTypes.arrayOf(PropTypes.string).isRequired,
};
