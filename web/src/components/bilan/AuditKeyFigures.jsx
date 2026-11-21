/**
 * @fileoverview Six chiffres clés de l'onglet Audit du Bilan, au modèle de l'onglet État
 * mais sans badge : ces chiffres d'équipe n'ont pas de seuil (ADR 0035). Définitions derrière
 * l'icône d'aide, tendances données par l'API (`trends`, absentes : rien).
 * @module components/bilan/AuditKeyFigures
 */

import PropTypes from 'prop-types';
import { Grid } from '@radix-ui/themes';
import FigureCard from '@/components/bilan/FigureCard';
import { DEFINITIONS } from '@/components/audit-synthese/definitions';
import { formatPct, formatNumber } from '@/hooks/organisation/organisationFormat';

// Une valeur par mois de la période ; null si le mois n'a pas de valeur
const series = (monthly, field) => monthly?.map((m) => m[field]);

function shareFigure({ label, definition, field, detail }, { totals, monthly, trends }) {
  return {
    label, definition, value: formatPct(totals[field]), detail: detail(totals),
    trend: trends?.[field], series: series(monthly, field), seriesFormat: formatPct,
  };
}

const SHARES = [
  {
    label: 'Tâches sans garant', field: 'without_guarantor_share', definition: DEFINITIONS.withoutGuarantor,
    detail: (t) => `${t.tasks_without_guarantor} sur ${t.tasks_created} créées`,
  },
  {
    label: 'Faites sans action du garant', field: 'done_without_guarantor_action_share',
    definition: DEFINITIONS.doneWithoutGuarantorAction,
    detail: (t) => `${t.done_without_guarantor_action} sur ${t.tasks_done_with_guarantor} terminées avec garant`,
  },
  {
    label: 'Repérées sur le terrain', field: 'spotted_in_field_share', definition: DEFINITIONS.spottedInField,
    detail: (t) => `${t.spotted_in_field} sur ${t.tasks_done_with_guarantor} terminées avec garant`,
  },
  {
    label: 'Tâches partagées', field: 'shared_tasks_share', definition: DEFINITIONS.sharedTasks,
    detail: (t) => `${t.shared_tasks} sur ${t.tasks_done} terminées`,
  },
];

function decisionsFigure({ totals, monthly, trends }) {
  return {
    label: 'Décisions hors travail normal', value: formatNumber(totals.decisions_total, 0),
    definition: DEFINITIONS.decisions, detail: `sur ${totals.audit_events} événements du journal`,
    trend: trends?.decisions_total, series: series(monthly, 'decisions_total'), seriesFormat: (v) => String(v),
  };
}

function systemFigure({ totals, monthly, trends }) {
  return {
    label: 'Modifications automatiques', value: formatPct(totals.system_share), definition: DEFINITIONS.system,
    detail: `${totals.system_events} sur ${totals.audit_events} événements`,
    trend: trends?.system_share, series: series(monthly, 'system_share'), seriesFormat: formatPct,
  };
}

function auditFigures(data) {
  return [
    ...SHARES.map((spec) => shareFigure(spec, data)),
    decisionsFigure(data),
    systemFigure(data),
  ];
}

/** @param {Object} data - réponse de /stats/audit-synthese (totals, monthly, trends facultatif) */
export default function AuditKeyFigures({ data }) {
  return (
    <Grid columns={{ initial: '1', xs: '2', lg: '3' }} gap="2" mb="2">
      {auditFigures(data).map((f) => <FigureCard key={f.label} {...f} />)}
    </Grid>
  );
}
AuditKeyFigures.propTypes = { data: PropTypes.object.isRequired };
