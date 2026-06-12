import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import { fetchActionCategories } from '@/api/actionCategories';
import { fetchComplexityFactors } from '@/api/complexityFactors';
import TaskSearchColumn from './TaskSearchColumn';
import DayContextRightColumn from './DayContextRightColumn';

export default function DayContextPanel({
  date,
  techId,
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

  const preselectedTasks = useMemo(() => {
    const task = preselectedAction?.task ?? preselectedAction?.tasks?.[0] ?? null;
    const iv = preselectedAction?.intervention ?? null;
    if (!task || !iv) return [];
    return [{
      ...task,
      _intervention: {
        id: iv.id, code: iv.code ?? '', title: iv.title ?? '',
        status_actual: iv.status_actual ?? null,
        type_inter: iv.type_inter ?? null, plan_id: iv.plan_id ?? null,
      },
    }];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tâches cochées (portent ._intervention)
  const [selectedTasks, setSelectedTasks] = useState(preselectedTasks);

  // Intervention créée à la volée via DI
  const [createdIntervention, setCreatedIntervention] = useState(null);

  const handleTasksChange = useCallback((tasks) => {
    setSelectedTasks(tasks ?? []);
    if (tasks?.length > 0) setCreatedIntervention(null);
  }, []);

  const handleInterventionCreated = useCallback((created) => {
    setCreatedIntervention(created);
    setSelectedTasks([]);
  }, []);

  const handleSuccess = useCallback(() => {
    setSelectedTasks([]);
    setCreatedIntervention(null);
    onActionCreated?.();
  }, [onActionCreated]);

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : 'Jour sélectionné';

  return (
    <Box style={{ display: 'grid', gridTemplateColumns: '45fr 55fr', gap: 'var(--space-5)', alignItems: 'start' }}>
      <TaskSearchColumn
        formattedDate={formattedDate}
        selectedTasks={selectedTasks}
        onTasksChange={handleTasksChange}
        onInterventionCreated={handleInterventionCreated}
      />

      <Box style={{ position: 'sticky', top: '1rem', alignSelf: 'start' }}>
        <DayContextRightColumn
          date={date}
          techId={techId}
          selectedTasks={selectedTasks}
          onTasksChange={handleTasksChange}
          createdIntervention={createdIntervention}
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
  weekActionsForDay: PropTypes.arrayOf(PropTypes.object),
  preselectedAction: PropTypes.object,
  onActionCreated: PropTypes.func,
  onClose: PropTypes.func,
};
