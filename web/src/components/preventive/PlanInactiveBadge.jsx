import PropTypes from 'prop-types';
import { Badge } from '@radix-ui/themes';

/** Badge « Inactif » d'un plan préventif désactivé ; rien pour un plan actif. */
export default function PlanInactiveBadge({ plan }) {
  if (plan.active !== false) return null;
  return <Badge color="gray" variant="soft" size="1">Inactif</Badge>;
}

PlanInactiveBadge.propTypes = {
  plan: PropTypes.shape({ active: PropTypes.bool }).isRequired,
};
