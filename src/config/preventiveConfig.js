export const triggerLabel = (plan) =>
  plan.trigger_type === 'periodicity'
    ? `Périodicité ${plan.periodicity_days}j`
    : `Compteur ${plan.hours_threshold}h`;
