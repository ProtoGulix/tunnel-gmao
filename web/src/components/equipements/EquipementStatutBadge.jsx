/**
 * @fileoverview Badge de statut du cycle de vie d'un équipement
 * @module components/equipements/EquipementStatutBadge
 */

import PropTypes from 'prop-types';
import { Badge } from '@radix-ui/themes';

export default function EquipementStatutBadge({ statut }) {
  if (!statut) return null;
  return (
    <Badge
      size="1"
      variant="soft"
      style={{
        flexShrink: 0,
        backgroundColor: statut.couleur ? `${statut.couleur}22` : 'var(--gray-3)',
        color: statut.couleur || 'var(--gray-11)',
        border: `1px solid ${statut.couleur || 'var(--gray-6)'}44`,
      }}
    >
      {statut.label}
    </Badge>
  );
}

EquipementStatutBadge.propTypes = {
  statut: PropTypes.shape({ label: PropTypes.string, couleur: PropTypes.string }),
};
