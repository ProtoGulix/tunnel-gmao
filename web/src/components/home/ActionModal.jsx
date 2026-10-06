import PropTypes from 'prop-types';
import { Dialog, VisuallyHidden } from '@radix-ui/themes';
import DayContextPanel from '@/components/planning/DayContextPanel';

export default function ActionModal({
  open,
  onOpenChange,
  date,
  techId,
  techInitials,
  weekActionsForDay = [],
  preselectedAction = null,
  onActionCreated,
}) {
  const handleActionCreated = () => {
    onActionCreated?.();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        style={{
          maxWidth: 1300,
          width: '98vw',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: 'var(--space-5)',
        }}
      >
        <VisuallyHidden><Dialog.Title>Planification</Dialog.Title></VisuallyHidden>
        {open && (
          <DayContextPanel
            date={date}
            techId={techId}
            techInitials={techInitials}
            weekActionsForDay={weekActionsForDay}
            preselectedAction={preselectedAction}
            onClose={() => onOpenChange(false)}
            onActionCreated={handleActionCreated}
          />
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

ActionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  date: PropTypes.string,
  techId: PropTypes.string,
  techInitials: PropTypes.string,
  weekActionsForDay: PropTypes.array,
  preselectedAction: PropTypes.object,
  onActionCreated: PropTypes.func,
};
