/**
 * @fileoverview Badge de santé d'équipement
 * @module EquipementHealthBadge
 */

import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

const HEALTH_CONFIG = {
  ok: {
    color: 'green',
    icon: CheckCircle2,
    label: 'Opérationnel',
  },
  maintenance: {
    color: 'orange',
    icon: AlertCircle,
    label: 'Maintenance',
  },
  warning: {
    color: 'yellow',
    icon: AlertCircle,
    label: 'Attention',
  },
  critical: {
    color: 'red',
    icon: AlertTriangle,
    label: 'Critique',
  },
};

/**
 * Badge de santé avec icône et label
 *
 * @component
 * @param {Object} props
 * @param {string} props.level - Niveau de santé (ok|maintenance|warning|critical)
 * @param {boolean} [props.showIcon=true] - Afficher l'icône
 * @param {boolean} [props.showLabel=false] - Afficher le label
 * @returns {JSX.Element} Badge de santé
 *
 * @example
 * <EquipementHealthBadge level="critical" showLabel />
 */
export default function EquipementHealthBadge({
  level = 'ok',
  showIcon = true,
  showLabel = false,
}) {
  const config = HEALTH_CONFIG[level] || HEALTH_CONFIG.ok;
  const Icon = config.icon;

  return (
    <Flex align="center" gap="1">
      {showIcon && <Icon size={16} />}
      <Badge color={config.color} size="1">
        {showLabel ? config.label : level.toUpperCase()}
      </Badge>
    </Flex>
  );
}

EquipementHealthBadge.propTypes = {
  level: PropTypes.oneOf(['ok', 'maintenance', 'warning', 'critical']),
  showIcon: PropTypes.bool,
  showLabel: PropTypes.bool,
};
