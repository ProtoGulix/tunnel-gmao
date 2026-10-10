/**
 * @fileoverview Pastille de santé d'un équipement (liste master-detail)
 * @module components/equipements/EquipementHealthDot
 */

import PropTypes from 'prop-types';
import { HEALTH_CONFIG } from '@/components/ui/EquipementHealthBadge';

export default function EquipementHealthDot({ level, size = 10 }) {
  const config = HEALTH_CONFIG[level];
  return (
    <span
      role="img"
      aria-label={config?.label ?? 'Santé inconnue'}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: config ? `var(--${config.color}-9)` : 'var(--gray-7)',
      }}
    />
  );
}

EquipementHealthDot.propTypes = {
  level: PropTypes.string,
  size: PropTypes.number,
};
