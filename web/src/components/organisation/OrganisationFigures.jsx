/**
 * @fileoverview Page Organisation sans graphique : tuiles d'état actuel, tuiles de la période,
 * tableau des valeurs par mois
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

function partsTile(w) {
  return {
    title: 'Attente de pièces',
    sentence: w.count === 0
      ? 'Attente de pièces : aucune intervention.'
      : `Attente de pièces : ${w.count} intervention${w.count > 1 ? 's' : ''}, âge médian ${formatDays(w.median_age_days)}.`,
    level: w.count === 0 ? 'ok' : 'info',
    statusLabel: w.count === 0 ? 'Aucune' : 'En cours',
    definition: DEFINITIONS.waitingParts,
  };
}

/** Trois tuiles d'état actuel (hors période) */
export function StateTiles({ preventive, waitingParts, now }) {
  const tiles = [preventiveTile(preventive), generationTile(preventive, now), partsTile(waitingParts)];
  return (
    <Grid columns={{ initial: '1', md: '3' }} gap="3" mb="4">
      {tiles.map((t) => <StateTile key={t.title} {...t} />)}
    </Grid>
  );
}
StateTiles.propTypes = {
  preventive: PropTypes.object.isRequired,
  waitingParts: PropTypes.object.isRequired,
  now: PropTypes.instanceOf(Date),
};

function Figure({ label, value, detail }) {
  return (
    <Box style={{ border: '1px solid var(--gray-a5)', borderRadius: 'var(--radius-3)', padding: '6px 10px' }}>
      <Text as="div" size="1" color="gray">{label}</Text>
      <Text as="div" size="4" weight="bold">{value}</Text>
      {detail && <Text as="div" size="1" color="gray">{detail}</Text>}
    </Box>
  );
}
Figure.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired, detail: PropTypes.string };

/** Quatre chiffres de la période choisie */
export function PeriodFigures({ totals }) {
  const hours = totals.hours;
  return (
    <Grid columns={{ initial: '2', md: '4' }} gap="2" mb="4">
      <Figure
        label="Chantiers coupés par une urgence"
        value={formatPct(totals.interrupted_share)}
        detail={`${totals.chantiers_interrupted} sur ${totals.chantiers_started}`}
      />
      <Figure
        label="Part d'urgences"
        value={formatPct(totals.urgent_share)}
        detail={`${totals.urgent_count} sur ${totals.interventions_reported}`}
      />
      <Figure
        label="Interventions par journée de technicien"
        value={formatNumber(totals.avg_interventions_per_tech_day)}
        detail={`${totals.tech_days} journées`}
      />
      <Figure
        label="Part du préventif dans les heures"
        value={formatPct(shareOf(hours.PRE, hours.total))}
        detail={`${formatHours(hours.PRE)} sur ${formatHours(hours.total)}`}
      />
    </Grid>
  );
}
PeriodFigures.propTypes = { totals: PropTypes.object.isRequired };

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
