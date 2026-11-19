/**
 * Pastille rouge « +N j » des plans préventifs en retard.
 * La valeur est `days_overdue` de l'API, rien n'est calculé ici.
 */

import PropTypes from 'prop-types';
import { Badge } from '@radix-ui/themes';
import { overdueBadgeLabel, overdueLabel } from '@/config/preventiveConfig';

export default function OverdueBadge({ days }) {
  const label = overdueBadgeLabel(days);
  if (!label) return null;
  return (
    <Badge color="red" variant="solid" size="2" title={overdueLabel(days)}>
      {label}
    </Badge>
  );
}
OverdueBadge.propTypes = { days: PropTypes.number };
