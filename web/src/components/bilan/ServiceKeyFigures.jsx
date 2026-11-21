/**
 * @fileoverview Bandeau des huit chiffres clés de l'onglet État du service (ADR 0033, 0034).
 * Charge, fragmentation et pilotage viennent de /stats/service-status, les cinq autres de
 * /stats/organisation (absents sans le droit). Définitions derrière l'icône d'aide.
 * @module components/bilan/ServiceKeyFigures
 */

import PropTypes from 'prop-types';
import { Grid, Text } from '@radix-ui/themes';
import FigureCard, { levelOfColor } from '@/components/bilan/FigureCard';
import { DEFINITIONS } from '@/components/organisation/definitions';
import { SERVICE_DEFINITIONS } from '@/components/service-status/config';
import { thresholdsLine } from '@/hooks/bilan/figureNotes';
import {
  formatPct, formatNumber, formatDays, formatHours, shareOf,
} from '@/hooks/organisation/organisationFormat';

// Badge d'après le statut de l'API (couleur et texte tels quels) ; sans statut, pas de badge
const statusOf = (apiStatus) => (
  apiStatus?.text ? { level: levelOfColor(apiStatus.color), label: apiStatus.text } : null
);

// Définition de l'indicateur suivie de sa ligne de seuils, construite depuis ceux de l'API
function definitionWithThresholds(text, kind, thresholds) {
  const line = thresholdsLine(kind, thresholds?.[kind]);
  if (!line) return text;
  return (
    <>
      {text}
      <Text as="div" size="1" mt="1" weight="medium">{line}</Text>
    </>
  );
}

function serviceFigures(data) {
  if (!data) return [];
  const { statuses = {}, thresholds, monthly, trends } = data;
  return [
    {
      label: 'Charge du service', value: formatPct(data.chargePercent), status: statusOf(statuses.charge),
      definition: definitionWithThresholds(SERVICE_DEFINITIONS.charge, 'charge', thresholds),
      trend: trends?.charge_percent, series: series(monthly, (m) => m.chargePercent), seriesFormat: formatPct,
    },
    {
      label: 'Fragmentation', value: formatPct(data.fragPercent), status: statusOf(statuses.frag),
      definition: definitionWithThresholds(SERVICE_DEFINITIONS.fragmentation, 'fragmentation', thresholds),
      trend: trends?.frag_percent, series: series(monthly, (m) => m.fragPercent), seriesFormat: formatPct,
    },
    {
      label: 'Temps de pilotage', value: formatPct(data.pilotPercent), status: statusOf(statuses.pilot),
      definition: definitionWithThresholds(SERVICE_DEFINITIONS.pilot, 'pilotage', thresholds),
      trend: trends?.pilot_percent, series: series(monthly, (m) => m.pilotPercent), seriesFormat: formatPct,
    },
  ];
}

// Une valeur par mois de la période, null si le mois n'a pas de valeur ; sans série (ancienne API), undefined
const series = (monthly, pick) => monthly?.map(pick);

// Un bloc Organisation sans réponse (chargement ou erreur) affiche « — », jamais 0
function interventionFigures(totals, monthly, trends) {
  return [
    {
      label: "Part d'urgences", value: formatPct(totals?.urgent_share), definition: DEFINITIONS.urgent,
      detail: totals && `${totals.urgent_count} sur ${totals.interventions_reported}`,
      trend: trends?.urgent_share,
      series: series(monthly, (m) => m.urgent_share), seriesFormat: formatPct,
    },
    {
      label: 'Chantiers coupés par une urgence', value: formatPct(totals?.interrupted_share),
      definition: DEFINITIONS.interrupted,
      detail: totals && `${totals.chantiers_interrupted} sur ${totals.chantiers_started}`,
      trend: trends?.interrupted_share,
      series: series(monthly, (m) => m.interrupted_share), seriesFormat: formatPct,
    },
    {
      label: 'Interventions par journée de technicien', value: formatNumber(totals?.avg_interventions_per_tech_day),
      definition: DEFINITIONS.average, detail: totals && `${totals.tech_days} journées`,
      trend: trends?.avg_interventions_per_tech_day,
      series: series(monthly, (m) => m.avg_interventions_per_tech_day), seriesFormat: formatNumber,
    },
  ];
}

function preventiveShareFigure(hours, monthly, trends) {
  return {
    label: 'Part du préventif dans les heures', value: formatPct(hours && shareOf(hours.PRE, hours.total)),
    definition: DEFINITIONS.hours, detail: hours && `${formatHours(hours.PRE)} sur ${formatHours(hours.total)}`,
    trend: trends?.preventive_hours_share,
    series: series(monthly, (m) => shareOf(m.hours.PRE, m.hours.total)), seriesFormat: formatPct,
  };
}

function waitingPartsFigure(waiting, monthly, trends) {
  return {
    label: 'Attente de pièces', value: waiting ? String(waiting.count) : '—', definition: DEFINITIONS.waitingParts,
    detail: waiting && `interventions, âge médian ${formatDays(waiting.median_age_days)}`,
    trend: trends?.waiting_parts_count,
    series: series(monthly, (m) => m.waiting_parts_count), seriesFormat: (v) => String(v),
  };
}

function organisationFigures(org) {
  const { totals, monthly, trends, waiting_parts: waiting } = org ?? {};
  return [
    ...interventionFigures(totals, monthly, trends),
    preventiveShareFigure(totals?.hours, monthly, trends),
    waitingPartsFigure(waiting, monthly, trends),
  ];
}

/**
 * @param {Object|null} service - données de /stats/service-status (null : pas de réponse)
 * @param {Object|null} organisation - données de /stats/organisation (null : pas de réponse)
 * @param {boolean} showOrganisation - false : droit absent, les cinq chiffres ne s'affichent pas
 */
export default function ServiceKeyFigures({ service, organisation, showOrganisation }) {
  const figures = [...serviceFigures(service), ...(showOrganisation ? organisationFigures(organisation) : [])];
  return (
    <Grid columns={{ initial: '1', xs: '2', lg: '4' }} gap="2" mb="2">
      {figures.map((f) => <FigureCard key={f.label} {...f} />)}
    </Grid>
  );
}
ServiceKeyFigures.propTypes = {
  service: PropTypes.object,
  organisation: PropTypes.object,
  showOrganisation: PropTypes.bool.isRequired,
};
