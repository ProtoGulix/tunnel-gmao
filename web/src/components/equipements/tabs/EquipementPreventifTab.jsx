/**
 * @fileoverview Onglet préventif d'un équipement
 * @module components/equipements/tabs/EquipementPreventifTab
 *
 * Affiche les plans de maintenance préventive (preventive_plans) et le résumé
 * des occurrences (preventive_occurrences_summary) retournés par GET /equipements/{id}.
 */
import { Box, Badge, Flex, Text } from '@radix-ui/themes';
import PropTypes from 'prop-types';
import EmptyState from '@/components/ui/EmptyState';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import OverdueBadge from '@/components/preventive/OverdueBadge';
import { formatDate } from '@/components/equipements/EquipementDetailSections';
import OccurrencesSummary from '@/components/equipements/OccurrencesSummary';
import AnticipatePlanButton, { AnticipateError } from '@/components/equipements/AnticipatePlanButton';
import EquipementPreventifHistory from '@/components/equipements/EquipementPreventifHistory';
import { SCHEDULE_STATE_COLORS, SCHEDULE_STATE_LABELS } from '@/config/preventiveConfig';

// État et échéance viennent de la route d'échéancier (aucun calcul ici)
function ScheduleInfo({ entry }) {
  if (!entry) return null;
  return (
    <Flex direction="column" align="end" gap="1">
      {entry.state === 'overdue' && <OverdueBadge days={entry.days_overdue} />}
      <Badge color={SCHEDULE_STATE_COLORS[entry.state] ?? 'gray'} variant="soft" size="1">
        {SCHEDULE_STATE_LABELS[entry.state] ?? entry.state}
      </Badge>
      {entry.state === 'not_computed' ? (
        <Text size="1" color="gray">Échéance non calculée</Text>
      ) : (
        <Text size="1" color="gray">Échéance {formatDate(entry.due_date)}</Text>
      )}
    </Flex>
  );
}

function PlanItem({ plan, entry, anticipate }) {
  const triggerText =
    plan.trigger_type === 'periodicity'
      ? `Périodicité : toutes les ${plan.periodicity_days} jours`
      : `Compteur horaire : tous les ${plan.hours_threshold}h`;

  return (
    <Box
      style={{
        background: 'var(--gray-2)',
        border: '1px solid var(--gray-4)',
        borderRadius: 'var(--radius-3)',
        padding: 'var(--space-3)',
      }}
    >
      <Flex justify="between" align="start" wrap="wrap" gap="2">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--accent-11)' }}>
              {plan.code}
            </Text>
            {!plan.active && <Badge color="gray" variant="outline" size="1">Inactif</Badge>}
          </Flex>
          <Text size="2">{plan.label}</Text>
          <Text size="1" color="gray">{triggerText}</Text>
        </Flex>
        <ScheduleInfo entry={entry} />
        {anticipate && (
          <AnticipatePlanButton plan={plan} isPending={anticipate.isPending} onConfirm={anticipate.onConfirm} />
        )}
        {plan.next_occurrence && (
          <Flex direction="column" align="end" gap="1">
            <Text size="1" color="gray">Prochaine occurrence</Text>
            <Text size="2" weight="medium" color="blue">{formatDate(plan.next_occurrence)}</Text>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

// Lancer en avance : plans à périodicité sans occurrence en cours (occurrence_id vide dans l'échéancier)
const canAnticipatePlan = (plan, entry) =>
  plan.active !== false && plan.trigger_type === 'periodicity' && Boolean(entry) && !entry.occurrence_id;

export default function EquipementPreventifTab({ equipement, schedule = [], history, anticipate }) {
  const { can } = usePermissions();
  const canAnticipate = can(PERM.preventive.anticipate);
  if (!equipement) return <Text color="gray">Aucune donnée</Text>;
  const entryByPlan = Object.fromEntries(schedule.map((e) => [e.plan_id, e]));
  // La route trie par échéance : la première ligne datée est la prochaine
  const next = schedule.find((e) => e.due_date);
  const overdueCount = schedule.filter((e) => e.state === 'overdue').length;

  const plans = equipement.preventive_plans ?? null;
  const summary = equipement.preventive_occurrences_summary;

  return (
    <Box py="4">
      <Flex direction="column" gap="5">
        {overdueCount > 0 && (
          <Badge color="red" variant="soft" size="2" style={{ alignSelf: 'flex-start' }}>
            {overdueCount} préventif{overdueCount > 1 ? 's' : ''} en retard
          </Badge>
        )}
        {next && (
          <Text size="2" color="gray">
            Prochaine échéance : <Text weight="medium">{formatDate(next.due_date)}</Text> ({next.plan_label})
          </Text>
        )}
        <AnticipateError message={anticipate?.error} />
        <OccurrencesSummary summary={summary} />

        <Box>
          <Text weight="medium" size="2" mb="3">Plans de maintenance préventive</Text>
          {plans === null ? (
            <EmptyState
              compact
              title="Pas de classe assignée"
              description="Assignez une classe d'équipement pour voir les plans de maintenance."
            />
          ) : plans.length === 0 ? (
            <EmptyState
              compact
              title="Aucun plan actif"
              description="La classe de cet équipement n'a pas de plans de maintenance actifs."
            />
          ) : (
            <Flex direction="column" gap="2">
              {plans.map((plan) => (
                <PlanItem
                  key={plan.id}
                  plan={plan}
                  entry={entryByPlan[plan.id]}
                  anticipate={
                    canAnticipate && anticipate && canAnticipatePlan(plan, entryByPlan[plan.id])
                      ? { isPending: anticipate.pendingPlanId === plan.id, onConfirm: anticipate.anticipate }
                      : null
                  }
                />
              ))}
            </Flex>
          )}
        </Box>
        {history && <EquipementPreventifHistory history={history} />}
      </Flex>
    </Box>
  );
}

EquipementPreventifTab.propTypes = {
  equipement: PropTypes.object,
  schedule: PropTypes.array,
  history: PropTypes.object,
  anticipate: PropTypes.object,
};

ScheduleInfo.propTypes = { entry: PropTypes.object };

PlanItem.propTypes = {
  entry: PropTypes.object,
  anticipate: PropTypes.shape({ isPending: PropTypes.bool, onConfirm: PropTypes.func }),
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    label: PropTypes.string,
    trigger_type: PropTypes.string,
    periodicity_days: PropTypes.number,
    hours_threshold: PropTypes.number,
    active: PropTypes.bool,
    next_occurrence: PropTypes.string,
  }).isRequired,
};
