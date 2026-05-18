import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import { fetchActionCategories } from '@/api/actionCategories';
import { fetchComplexityFactors } from '@/api/complexityFactors';
import DayContextLeftColumn from './DayContextLeftColumn';
import DayContextRightColumn from './DayContextRightColumn';

function detectUniqueEquipement(actions) {
  if (!actions?.length) return null;
  const equipements = actions.map((a) => {
    const iv = a.intervention;
    if (!iv) return null;
    if (iv.machine) return { id: iv.machine.id, code: iv.machine.code ?? '', name: iv.machine.name ?? '' };
    if (iv.equipement_id) return { id: iv.equipement_id, code: iv.equipement_code ?? '', name: iv.equipement_name ?? '' };
    return null;
  }).filter(Boolean);
  if (!equipements.length) return null;
  const firstId = equipements[0].id;
  if (!equipements.every((m) => m.id === firstId)) return null;
  return equipements[0];
}

export default function DayContextPanel({
  date,
  techId,
  weekActionsForDay = [],
  preselectedAction = null,
  onActionCreated,
  onClose,
}) {
  const [metadata, setMetadata] = useState({ subcategories: [], complexityFactors: [] });

  useEffect(() => {
    Promise.all([fetchActionCategories(), fetchComplexityFactors()])
      .then(([cats, factors]) => setMetadata({ subcategories: cats ?? [], complexityFactors: factors ?? [] }))
      .catch(() => {});
  }, []);

  const preselectedEquipement = useMemo(() => {
    const iv = preselectedAction?.intervention;
    if (iv?.machine) {
      const m = iv.machine;
      return { id: m.id, code: m.code ?? '', name: m.name ?? '' };
    }
    if (iv?.equipement_id) {
      return { id: iv.equipement_id, code: iv.equipement_code ?? '', name: iv.equipement_name ?? '' };
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
          onCancel={onClose}
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
  onClose: PropTypes.func,
};
