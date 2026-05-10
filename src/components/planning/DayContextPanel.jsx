import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import { fetchActionCategories } from '@/api/actionCategories';
import { fetchComplexityFactors } from '@/api/complexityFactors';
import DayContextLeftColumn from './DayContextLeftColumn';
import DayContextRightColumn from './DayContextRightColumn';

function detectUniqueEquipement(actions) {
  if (!actions?.length) return null;
  const machines = actions.map((a) => a.intervention?.machine).filter(Boolean);
  if (!machines.length) return null;
  const firstId = machines[0].id;
  if (!machines.every((m) => m.id === firstId)) return null;
  return { id: machines[0].id, code: machines[0].code ?? '', name: machines[0].name ?? '' };
}

export default function DayContextPanel({
  date,
  techId,
  weekActionsForDay = [],
  preselectedAction = null,
  onActionCreated,
}) {
  const [metadata, setMetadata] = useState({ subcategories: [], complexityFactors: [] });

  useEffect(() => {
    Promise.all([fetchActionCategories(), fetchComplexityFactors()])
      .then(([cats, factors]) => setMetadata({ subcategories: cats ?? [], complexityFactors: factors ?? [] }))
      .catch(() => {});
  }, []);

  const preselectedEquipement = useMemo(() => {
    if (preselectedAction?.intervention?.machine) {
      const m = preselectedAction.intervention.machine;
      return { id: m.id, code: m.code ?? '', name: m.name ?? '' };
    }
    return detectUniqueEquipement(weekActionsForDay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preselectedIntervention = useMemo(() => {
    if (!preselectedAction?.intervention) return null;
    const iv = preselectedAction.intervention;
    return { id: iv.id, code: iv.code ?? '', title: iv.title ?? '', status_actual: iv.status_actual ?? null, plan_id: iv.plan_id ?? null, machine: iv.machine ?? null };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pickedEquipement, setPickedEquipement] = useState(preselectedEquipement);
  const [selectedIntervention, setSelectedIntervention] = useState(preselectedIntervention);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const equipementId = pickedEquipement?.id ?? null;
  const equipementLabel = pickedEquipement
    ? `${pickedEquipement.code ? pickedEquipement.code + ' — ' : ''}${pickedEquipement.name ?? ''}`
    : '';

  const handleEquipementChange = useCallback((eq) => {
    setPickedEquipement(eq);
    setSelectedIntervention(null);
    setSelectedRequest(null);
  }, []);

  const handleSuccess = useCallback(() => {
    setSelectedIntervention(null);
    setSelectedRequest(null);
    onActionCreated?.();
  }, [onActionCreated]);

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : 'Jour sélectionné';

  return (
    <Box style={{ display: 'grid', gridTemplateColumns: '45fr 55fr', gap: 'var(--space-5)', alignItems: 'start' }}>
      <DayContextLeftColumn
        formattedDate={formattedDate}
        pickedEquipement={pickedEquipement}
        onEquipementChange={handleEquipementChange}
        preselectedEquipement={preselectedEquipement}
        equipementId={equipementId}
        equipementLabel={equipementLabel}
        selectedIntervention={selectedIntervention}
        onSelectIntervention={setSelectedIntervention}
        selectedRequest={selectedRequest}
        onSelectRequest={setSelectedRequest}
      />

      <Box style={{ position: 'sticky', top: '1rem', alignSelf: 'start' }}>
        <DayContextRightColumn
          date={date}
          techId={techId}
          equipementId={equipementId}
          equipementLabel={equipementLabel}
          selectedIntervention={selectedIntervention}
          selectedRequest={selectedRequest}
          onSuccess={handleSuccess}
          metadata={metadata}
        />
      </Box>
    </Box>
  );
}

DayContextPanel.propTypes = {
  date: PropTypes.string,
  techId: PropTypes.string,
  techInitials: PropTypes.string,
  weekActionsForDay: PropTypes.arrayOf(PropTypes.object),
  preselectedAction: PropTypes.object,
  onActionCreated: PropTypes.func,
};
