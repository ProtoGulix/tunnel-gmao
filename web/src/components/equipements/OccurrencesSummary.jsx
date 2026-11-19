/**
 * @fileoverview Résumé des occurrences préventives d'un équipement (compteurs et prochaine échéance)
 * @module components/equipements/OccurrencesSummary
 */
import { Box, Card, Flex, Grid, Text } from '@radix-ui/themes';
import { CalendarClock, CheckCircle2, Clock, SkipForward } from 'lucide-react';
import PropTypes from 'prop-types';
import { formatDate } from '@/components/equipements/EquipementDetailSections';

export default function OccurrencesSummary({ summary }) {
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

OccurrencesSummary.propTypes = {
  summary: PropTypes.shape({
    pending_count: PropTypes.number,
    generated_count: PropTypes.number,
    skipped_count: PropTypes.number,
    next_scheduled: PropTypes.string,
    last_skipped_reason: PropTypes.string,
  }),
};
