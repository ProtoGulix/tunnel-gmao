/**
 * @fileoverview Organisation sans graphique : tuiles d'état du préventif, tableau des valeurs par mois
 * @module components/organisation/OrganisationFigures
 */

import PropTypes from 'prop-types';
import { Badge, Box, Card, Flex, Grid, Table, Text } from '@radix-ui/themes';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { DEFINITIONS } from '@/components/organisation/definitions';
import { formatMonthLong } from '@/hooks/equipements/dashboardFormat';
import {
  formatPct, formatNumber, formatDays, formatHours, shareOf, generationStatus,
} from '@/hooks/organisation/organisationFormat';

// Pastille de statut : icône et libellé, jamais la couleur seule
const STATUS = {
  ok: { color: 'green', Icon: CheckCircle2 },
  alert: { color: 'orange', Icon: AlertTriangle },
  info: { color: 'gray', Icon: Info },
};

function StatusBadge({ level, label }) {
  const { color, Icon } = STATUS[level];
  return (
    <Badge color={color} variant="soft" size="1">
      <Icon size={12} aria-hidden /> {label}
    </Badge>
  );
}
StatusBadge.propTypes = { level: PropTypes.oneOf(['ok', 'alert', 'info']).isRequired, label: PropTypes.string.isRequired };

function StateTile({ title, sentence, level, statusLabel, definition }) {
  return (
    <Card size="1">
      <Flex direction="column" gap="2" style={{ height: '100%' }}>
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <Text size="1" color="gray">{title}</Text>
          <StatusBadge level={level} label={statusLabel} />
        </Flex>
        <Text as="div" size="3" weight="medium">{sentence}</Text>
        <Text as="div" size="1" color="gray">{definition}</Text>
      </Flex>
    </Card>
  );
}
StateTile.propTypes = {
  title: PropTypes.string.isRequired,
  sentence: PropTypes.string.isRequired,
  level: PropTypes.oneOf(['ok', 'alert', 'info']).isRequired,
  statusLabel: PropTypes.string.isRequired,
  definition: PropTypes.string.isRequired,
};

function preventiveTile(p) {
  const waiting = p.pending_requests;
  return {
    title: 'Préventif en attente',
    sentence: waiting === 0
      ? 'Préventif : aucune demande en attente.'
      : `Préventif : ${waiting} demande${waiting > 1 ? 's' : ''} en attente, la plus ancienne depuis ${formatDays(p.oldest_pending_request_days)}.`,
    level: waiting === 0 ? 'ok' : 'alert',
    statusLabel: waiting === 0 ? 'À jour' : 'À traiter',
    definition: DEFINITIONS.preventive,
  };
}

function generationTile(p, now) {
  const { days, alert } = generationStatus(p.last_generated_at, now);
  return {
    title: 'Génération du préventif',
    sentence: days == null
      ? 'Dernière génération du préventif : aucune.'
      : `Dernière génération du préventif : il y a ${formatDays(days)}.`,
    level: alert ? 'alert' : 'ok',
    statusLabel: alert ? 'En retard' : 'À jour',
    definition: DEFINITIONS.generation,
  };
}

// Compte des lignes « en retard » de la route d'échéancier ; null tant que la route n'a pas répondu
function overdueTile(count) {
  return {
    title: 'Préventifs en retard',
    sentence: count === 0
      ? 'Préventifs en retard : aucun.'
      : `Préventifs en retard : ${count} plan${count > 1 ? 's' : ''} sur équipement${count > 1 ? 's' : ''}.`,
    level: count === 0 ? 'ok' : 'alert',
    statusLabel: count === 0 ? 'À jour' : 'En retard',
    definition: DEFINITIONS.overdue,
  };
}

/** Tuiles d'état actuel du préventif (hors période) ; l'attente de pièces est dans le bandeau */
export function StateTiles({ preventive, overdueCount, now }) {
  const tiles = [preventiveTile(preventive), generationTile(preventive, now)];
  if (overdueCount != null) tiles.push(overdueTile(overdueCount));
  return (
    <Grid columns={{ initial: '1', md: '2', lg: String(tiles.length) }} gap="3" mb="4">
      {tiles.map((t) => <StateTile key={t.title} {...t} />)}
    </Grid>
  );
}
StateTiles.propTypes = {
  preventive: PropTypes.object.isRequired,
  overdueCount: PropTypes.number,
  now: PropTypes.instanceOf(Date),
};

/** Valeurs par mois, repliées par défaut */
export function MonthlyTable({ monthly }) {
  return (
    <details style={{ marginTop: 'var(--space-3)' }}>
      <summary><Text size="1" color="gray">Valeurs par mois</Text></summary>
      <Box style={{ overflowX: 'auto' }}>
        <Table.Root size="1" mt="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Mois</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Chantiers coupés</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Urgences</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Heures</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Préventif</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Interv. par journée</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Journées à 3 ou +</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {monthly.map((m) => (
              <Table.Row key={m.month}>
                <Table.RowHeaderCell>{formatMonthLong(m.month)}</Table.RowHeaderCell>
                <Table.Cell justify="end">{formatPct(m.interrupted_share)}</Table.Cell>
                <Table.Cell justify="end">{formatPct(m.urgent_share)}</Table.Cell>
                <Table.Cell justify="end">{formatHours(m.hours.total)}</Table.Cell>
                <Table.Cell justify="end">{formatPct(shareOf(m.hours.PRE, m.hours.total))}</Table.Cell>
                <Table.Cell justify="end">{formatNumber(m.avg_interventions_per_tech_day)}</Table.Cell>
                <Table.Cell justify="end">{formatPct(m.scattered_days_share)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </details>
  );
}
MonthlyTable.propTypes = { monthly: PropTypes.array.isRequired };
