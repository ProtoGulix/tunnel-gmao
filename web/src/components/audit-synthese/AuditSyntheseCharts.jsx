/**
 * @fileoverview Graphiques mensuels de la synthèse de l'audit (Recharts chargé à la demande,
 * mêmes blocs que la page Organisation).
 * @module components/audit-synthese/AuditSyntheseCharts
 */

import PropTypes from 'prop-types';
import { ShareChart } from '@/components/organisation/OrganisationCharts';
import { DEFINITIONS } from '@/components/audit-synthese/definitions';

const ACCENT = 'var(--accent-9)';

export default function AuditSyntheseCharts({ monthly }) {
  return (
    <>
      <ShareChart
        monthly={monthly} field="without_guarantor_share" title="Part de tâches sans garant"
        definition={DEFINITIONS.withoutGuarantor} color={ACCENT} label="Sans garant"
      />
      <ShareChart
        monthly={monthly} field="done_without_guarantor_action_share" title="Part de tâches faites sans action du garant"
        definition={DEFINITIONS.doneWithoutGuarantorAction} color={ACCENT} label="Sans action du garant"
      />
      <ShareChart
        monthly={monthly} field="spotted_in_field_share" title="Part de tâches repérées sur le terrain"
        definition={DEFINITIONS.spottedInField} color={ACCENT} label="Repérées sur le terrain"
      />
      <ShareChart
        monthly={monthly} field="shared_tasks_share" title="Part de tâches partagées"
        definition={DEFINITIONS.sharedTasks} color={ACCENT} label="Tâches partagées"
      />
      <ShareChart
        monthly={monthly} field="system_share" title="Part de modifications automatiques"
        definition={DEFINITIONS.system} color={ACCENT} label="Automatiques"
      />
    </>
  );
}
AuditSyntheseCharts.propTypes = { monthly: PropTypes.array.isRequired };
