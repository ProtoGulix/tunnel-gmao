/**
 * @fileoverview Trois chiffres courts sur l'état actuel du préventif (hors période) : demandes
 * en attente, plans en retard, dernière génération (ADR 0034). L'attente de pièces est dans le bandeau.
 * @module components/bilan/PreventiveFigures
 */

import PropTypes from 'prop-types';
import { Grid } from '@radix-ui/themes';
import FigureCard from '@/components/bilan/FigureCard';
import { DEFINITIONS } from '@/components/organisation/definitions';
import { formatDays, generationStatus } from '@/hooks/organisation/organisationFormat';

function pendingFigure(p) {
  const waiting = p.pending_requests;
  return {
    label: 'Préventif en attente', value: String(waiting), definition: DEFINITIONS.preventive,
    detail: waiting === 0 ? undefined : `la plus ancienne : ${formatDays(p.oldest_pending_request_days)}`,
    status: waiting === 0 ? { level: 'ok', label: 'À jour' } : { level: 'alert', label: 'À traiter' },
  };
}

function overdueFigure(count) {
  return {
    label: 'Préventifs en retard', value: String(count), definition: DEFINITIONS.overdue,
    detail: count === 0 ? undefined : 'plans sur équipement',
    status: count === 0 ? { level: 'ok', label: 'À jour' } : { level: 'alert', label: 'En retard' },
  };
}

function generationFigure(p, now) {
  const { days, alert } = generationStatus(p.last_generated_at, now);
  return {
    label: 'Dernière génération', value: days == null ? 'Jamais' : formatDays(days), definition: DEFINITIONS.generation,
    status: alert ? { level: 'alert', label: 'En retard' } : { level: 'ok', label: 'À jour' },
  };
}

/**
 * @param {Object} preventive - bloc `preventive` de /stats/organisation
 * @param {number|null} overdueCount - plans en retard ; null : chiffre omis
 * @param {Date} [now]
 */
export default function PreventiveFigures({ preventive, overdueCount, now }) {
  const figures = [pendingFigure(preventive)];
  if (overdueCount != null) figures.push(overdueFigure(overdueCount));
  figures.push(generationFigure(preventive, now));
  return (
    <Grid columns={{ initial: '1', xs: '2', md: String(figures.length) }} gap="2" mb="2">
      {figures.map((f) => <FigureCard key={f.label} compact {...f} />)}
    </Grid>
  );
}
PreventiveFigures.propTypes = {
  preventive: PropTypes.object.isRequired,
  overdueCount: PropTypes.number,
  now: PropTypes.instanceOf(Date),
};
