import PropTypes from 'prop-types';
import { Dialog } from '@radix-ui/themes';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';

export default function TaskCreateDialog({ open, onOpenChange, interventionId = null, interventionLabel = null, onSuccess }) {
  const { formData, set, users, interventions, optionsLoading, saving, errors, reset, loadOptions, handleSubmit } = useTaskCreate({
    interventionId,
    onSuccess: (created) => {
      onSuccess?.(created);
      onOpenChange(false);
    },
  });

  const handleOpenChange = (isOpen) => {
    if (isOpen) loadOptions();
    else reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 500, padding: 0, background: 'transparent', boxShadow: 'none' }}>
        <TaskCreateForm
          formData={formData}
          set={set}
          users={users}
          interventions={interventions}
          optionsLoading={optionsLoading}
          saving={saving}
          errors={errors}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          interventionId={interventionId}
          interventionLabel={interventionLabel}
        />
      </Dialog.Content>
    </Dialog.Root>
  );
}

TaskCreateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  interventionId: PropTypes.string,
  interventionLabel: PropTypes.string,
  onSuccess: PropTypes.func,
};
