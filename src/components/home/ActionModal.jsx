import PropTypes from 'prop-types';
import { Dialog } from '@radix-ui/themes';
import DayContextPanel from '@/components/planning/DayContextPanel';

/**
 * Modal wrapping DayContextPanel for action creation from tasks or day slots.
 *
 * @param {Object}   props
 * @param {boolean}  props.open
 * @param {Function} props.onOpenChange
 * @param {string}   props.date           - YYYY-MM-DD
 * @param {string}   [props.techId]
 * @param {string}   [props.techInitials]
 * @param {Array}    [props.weekActionsForDay]
 * @param {Function} [props.onActionCreated]
 */
export default function ActionModal({
  open,
  onOpenChange,
  date,
  techId,
  techInitials,
  weekActionsForDay = [],
  onActionCreated,
}) {
  function handleActionCreated() {
    onActionCreated?.();
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        style={{
          maxWidth: 860,
          width: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 'var(--space-4)',
        }}
      >
        {open && date && (
          <DayContextPanel
            date={date}
            techId={techId}
            techInitials={techInitials}
            weekActionsForDay={weekActionsForDay}
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
  onActionCreated: PropTypes.func,
};
