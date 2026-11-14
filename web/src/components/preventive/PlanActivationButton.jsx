import PropTypes from 'prop-types';
import { Button } from '@radix-ui/themes';
import { Pause, Play, Trash2 } from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';

/**
 * « Désactiver » sur un plan actif, « Réactiver » sur un plan inactif, selon les droits.
 * compact : bouton icône des lignes de tableau.
 */
export default function PlanActivationButton({ plan, onDeactivate, onReactivate, compact = false }) {
  const { can } = usePermissions();
  if (plan.active === false) {
    if (!can(PERM.preventive.reactivatePlan)) return null;
    return compact ? (
      <Button size="1" variant="ghost" color="green" title="Réactiver" onClick={() => onReactivate(plan)}>
        <Play size={12} />
      </Button>
    ) : (
      <Button size="2" variant="soft" color="green" onClick={() => onReactivate(plan)}>
        <Play size={13} />Réactiver
      </Button>
    );
  }
  if (!can(PERM.preventive.removePlan)) return null;
  return compact ? (
    <Button size="1" variant="ghost" color="red" title="Désactiver" onClick={() => onDeactivate(plan)}>
      <Trash2 size={12} />
    </Button>
  ) : (
    <Button size="2" variant="soft" color="orange" onClick={() => onDeactivate(plan)}>
      <Pause size={13} />Désactiver
    </Button>
  );
}

PlanActivationButton.propTypes = {
  plan: PropTypes.shape({ active: PropTypes.bool }).isRequired,
  onDeactivate: PropTypes.func.isRequired,
  onReactivate: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};
