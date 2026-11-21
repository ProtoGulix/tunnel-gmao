/**
 * @fileoverview Bandeau des huit chiffres clés de l'onglet État du service (ADR 0033).
 * Charge, fragmentation et pilotage viennent de /stats/service-status, les cinq autres de
 * /stats/organisation (absents sans le droit). Chaque chiffre garde sa définition.
 * @module components/bilan/ServiceKeyFigures
 */

import PropTypes from 'prop-types';
import { Box, Grid, Text } from '@radix-ui/themes';
import { DEFINITIONS } from '@/components/organisation/definitions';
import { calculateMetrics } from '@/components/service-status/serviceMetrics';
import {
  formatPct, formatNumber, formatDays, formatHours, shareOf,
} from '@/hooks/organisation/organisationFormat';

const CHARGE_NOTICE = 'Temps total heures / Capacité ETP proratisée sur la période. Charge > 85% : service saturé.';
const PILOT_NOTICE = "% temps long protégé (documentation, préventif, dépannage réel). Pilotage < 15% : aucune capacité d'amélioration.";
const FRAG_NOTICE = '% temps fragmenté (support, actions courtes < 0,5h non-dépannage). Fragmentation > 25% : fuite organisationnelle.';

function Figure({ label, value, detail, definition, color }) {
  return (
    <Box style={{ border: '1px solid var(--gray-a5)', borderRadius: 'var(--radius-3)', padding: '6px 10px' }}>
      <Text as="div" size="1" color="gray">{label}</Text>
      <Text as="div" size="5" weight="bold" color={color}>{value}</Text>
      {detail && <Text as="div" size="1" color="gray">{detail}</Text>}
      <Text as="div" size="1" color="gray" mt="1">{definition}</Text>
    </Box>
  );
}
Figure.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  detail: PropTypes.string,
  definition: PropTypes.string.isRequired,
  color: PropTypes.string,
};

function serviceFigures(data) {
  if (!data) return [];
  const m = calculateMetrics(data);
  return [
    { label: 'Charge du service', value: `${data.chargePercent.toFixed(1)} %`, detail: m.chargeText, color: m.chargeColor, definition: CHARGE_NOTICE },
    { label: 'Fragmentation', value: `${data.fragPercent.toFixed(1)} %`, detail: m.fragText, color: m.fragColor, definition: FRAG_NOTICE },
    { label: 'Temps de pilotage', value: `${data.pilotPercent.toFixed(1)} %`, detail: m.pilotText, color: m.pilotColor, definition: PILOT_NOTICE },
  ];
}

// Un bloc Organisation sans réponse (chargement ou erreur) affiche « — », jamais 0
function interventionFigures(totals) {
  return [
    {
      label: "Part d'urgences", value: formatPct(totals?.urgent_share), definition: DEFINITIONS.urgent,
      detail: totals && `${totals.urgent_count} sur ${totals.interventions_reported}`,
    },
    {
      label: 'Chantiers coupés par une urgence', value: formatPct(totals?.interrupted_share),
      definition: DEFINITIONS.interrupted,
      detail: totals && `${totals.chantiers_interrupted} sur ${totals.chantiers_started}`,
    },
    {
      label: 'Interventions par journée de technicien', value: formatNumber(totals?.avg_interventions_per_tech_day),
      definition: DEFINITIONS.average, detail: totals && `${totals.tech_days} journées`,
    },
  ];
}

function preventiveShareFigure(hours) {
  return {
    label: 'Part du préventif dans les heures', value: formatPct(hours && shareOf(hours.PRE, hours.total)),
    definition: DEFINITIONS.hours, detail: hours && `${formatHours(hours.PRE)} sur ${formatHours(hours.total)}`,
  };
}

function waitingPartsFigure(waiting) {
  return {
    label: 'Attente de pièces', value: waiting ? String(waiting.count) : '—', definition: DEFINITIONS.waitingParts,
    detail: waiting && `interventions, âge médian ${formatDays(waiting.median_age_days)}`,
  };
}

function organisationFigures(org) {
  return [
    ...interventionFigures(org?.totals),
    preventiveShareFigure(org?.totals?.hours),
    waitingPartsFigure(org?.waiting_parts),
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
    <Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="2" mb="2">
      {figures.map((f) => <Figure key={f.label} {...f} />)}
    </Grid>
  );
}
ServiceKeyFigures.propTypes = {
  service: PropTypes.object,
  organisation: PropTypes.object,
  showOrganisation: PropTypes.bool.isRequired,
};
