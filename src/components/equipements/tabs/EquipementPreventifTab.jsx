/**
 * @fileoverview Onglet préventif d'un équipement
 * @module components/equipements/tabs/EquipementPreventifTab
 *
 * Affiche les plans de maintenance préventive (preventive_plans) et le résumé
 * des occurrences (preventive_occurrences_summary) retournés par GET /equipements/{id}.
 */
import { Box, Badge, Card, Flex, Grid, Text } from '@radix-ui/themes';
import { CalendarClock, CheckCircle2, Clock, SkipForward } from 'lucide-react';
import PropTypes from 'prop-types';
import EmptyState from '@/components/ui/EmptyState';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function OccurrencesSummary({ summary }) {
  if (!summary) return null;
  return (
    <Box>
      <Text weight="medium" size="2" mb="3">Résumé des occurrences</Text>
      <Grid columns={{ initial: '2', xs: '4' }} gap="3">
        <Card style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
          <Flex direction="column" align="center" gap="1">
            <Clock size={16} color="var(--orange-9)" />
            <Text size="4" weight="bold" color="orange">{summary.pending_count}</Text>
            <Text size="1" color="gray">En attente</Text>
          </Flex>
        </Card>
        <Card style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
          <Flex direction="column" align="center" gap="1">
            <CheckCircle2 size={16} color="var(--green-9)" />
            <Text size="4" weight="bold" color="green">{summary.generated_count}</Text>
            <Text size="1" color="gray">Générées</Text>
          </Flex>
        </Card>
        <Card style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
          <Flex direction="column" align="center" gap="1">
            <SkipForward size={16} color="var(--gray-9)" />
            <Text size="4" weight="bold" color="gray">{summary.skipped_count}</Text>
            <Text size="1" color="gray">Passées</Text>
          </Flex>
        </Card>
        {summary.next_scheduled && (
          <Card style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
            <Flex direction="column" align="center" gap="1">
              <CalendarClock size={16} color="var(--blue-9)" />
              <Text size="2" weight="bold" color="blue">{formatDate(summary.next_scheduled)}</Text>
              <Text size="1" color="gray">Prochaine</Text>
            </Flex>
          </Card>
        )}
      </Grid>
      {summary.last_skipped_reason && (
        <Text size="1" color="gray" mt="2">
          Dernier skip : {summary.last_skipped_reason}
        </Text>
      )}
    </Box>
  );
}

function PlanItem({ plan }) {
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

export default function EquipementPreventifTab({ equipement }) {
  if (!equipement) return <Text color="gray">Aucune donnée</Text>;

  const plans = equipement.preventive_plans ?? null;
  const summary = equipement.preventive_occurrences_summary;

  return (
    <Box py="4">
      <Flex direction="column" gap="5">
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
              {plans.map((plan) => <PlanItem key={plan.id} plan={plan} />)}
            </Flex>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

EquipementPreventifTab.propTypes = {
  equipement: PropTypes.object,
};

OccurrencesSummary.propTypes = {
  summary: PropTypes.shape({
    pending_count: PropTypes.number,
    generated_count: PropTypes.number,
    skipped_count: PropTypes.number,
    next_scheduled: PropTypes.string,
    last_skipped_reason: PropTypes.string,
  }),
};

PlanItem.propTypes = {
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
